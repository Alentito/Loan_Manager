# payroll/views.py
from calendar import monthrange
from datetime import date
from io import BytesIO
from decimal import Decimal

from django.conf import settings as dj_settings
from django.core.mail import send_mail
from django.db import transaction
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from openpyxl import Workbook

from .models import EmployeePayroll, IncentiveRule, PayrollSettings
from .serializers import (
    EmployeePayrollSerializer,
    IncentiveRuleSerializer,
    PayrollSettingsSerializer,
)

from employee.models import Employee, Attendance, PublicHoliday, Team
from payroll.payroll_calculator import PayrollCalculator
from django.db.models import Prefetch
from openpyxl import Workbook
from django.http import HttpResponse
from rest_framework.decorators import action
from rest_framework.response import Response



# -------------------------
# Helpers
# -------------------------
def money(v):
    try:
        return f"{Decimal(v):,.2f}"
    except Exception:
        return "0.00"


def dec(v):
    try:
        return Decimal(v)
    except Exception:
        return Decimal("0.00")


# -------------------------
# Simple email API
# -------------------------
class SendEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data or {}
        to = data.get("to", [])
        subject = data.get("subject", "")
        message = data.get("message", "")

        if isinstance(to, str):
            to = [t.strip() for t in to.split(",") if t.strip()]

        if not to or not subject or not message:
            return Response({"detail": "to, subject, message required"}, status=400)

        send_mail(subject, message, dj_settings.DEFAULT_FROM_EMAIL, to, fail_silently=False)
        return Response({"sent": len(to)})


# -------------------------
# ViewSets
# -------------------------
class IncentiveRuleViewSet(viewsets.ModelViewSet):
    queryset = IncentiveRule.objects.all().order_by("-priority", "min_files")
    serializer_class = IncentiveRuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["milestone__name", "roles__name"]
    ordering_fields = ["roles__name", "milestone__name", "min_files", "amount_per_file"]


class PayrollSettingsViewSet(viewsets.ModelViewSet):
    queryset = PayrollSettings.objects.all().order_by("-id")
    serializer_class = PayrollSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="current")
    def current(self, request):
        obj = PayrollSettings.objects.order_by("-id").first()
        if not obj:
            obj = PayrollSettings.objects.create()
        ser = self.get_serializer(obj)
        return Response(ser.data)
    



class EmployeePayrollViewSet(viewsets.ModelViewSet):
    queryset = EmployeePayroll.objects.select_related("employee").order_by("-month", "employee__name")
    serializer_class = EmployeePayrollSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["employee__name", "employee__login_id", "employee__company_email"]
    ordering_fields = ["month", "gross_salary", "net_salary", "employee__name"]
    ordering = ["-month"]

    def get_queryset(self):
        qs = self.queryset
        month_param = self.request.query_params.get("month")
        if month_param:
            try:
                y, m = map(int, month_param.split("-"))
                qs = qs.filter(month__year=y, month__month=m)
            except Exception:
                return EmployeePayroll.objects.none()
        user = self.request.user
        if user.is_superuser or user.has_perm("payroll.view_all_payrolls"):
            return qs
        try:
            emp = Employee.objects.get(user=user)
            return qs.filter(employee=emp)
        except Employee.DoesNotExist:
            return EmployeePayroll.objects.none()

    # -------------------------
    # Generate payrolls for a month (uses existing PayrollCalculator)
    # -------------------------
    @action(detail=False, methods=["post"])
    def generate(self, request):
        """
        POST /api/payroll/payrolls/generate/
        body: {"month": "YYYY-MM"} (example: "2026-01")
        Optional: {"save": true/false} — if save = false returns preview
        """
        month_str = request.data.get("month") or request.query_params.get("month")
        save = bool(request.data.get("save", True))

        if not month_str:
            return Response({"detail": "month required (YYYY-MM)"}, status=400)
        try:
            year, mon = map(int, month_str.split("-"))
            period_start = date(year, mon, 1)
            period_end = date(year, mon, monthrange(year, mon)[1])
        except Exception:
            return Response({"detail": "invalid month format"}, status=400)

        calculator = PayrollCalculator(period_start, period_end)
        computations = calculator.run()

        if not save:
            preview = [
                {
                    "employee": c.employee.name,
                    "base_pay": str(c.base_pay),
                    "incentive": str(c.incentive_pay),
                    "gross": str(c.gross_pay),
                    "deductions": str(c.statutory_deductions),
                    "net": str(c.net_pay),
                    "loans_count": c.loans_count,
                }
                for c in computations
            ]
            return Response({"preview": preview, "count": len(preview)})

        with transaction.atomic():
            saved = calculator.save_computations(computations, status="draft")
        ser = self.get_serializer(saved, many=True)
        return Response(ser.data, status=201)



    #Export
    #--------------------------
    queryset = EmployeePayroll.objects.all()

    @action(detail=False, methods=["get"])
    def export_excel(self, request):
        month = request.GET.get("month")  # YYYY-MM
        if not month:
            return Response({"error": "month required"}, status=400)

        wb = Workbook()
        ws = wb.active
        ws.title = f"Payroll {month}"

        HEADERS = [
            "Employee Code",
            "Employee Name",
            "Designation",
            "Gross Salary",
            "Net Salary",
        ]

        def write_headers():
            ws.append(HEADERS)

        # ----------------------------------
        # Fetch payrolls once (efficient)
        # ----------------------------------
        payrolls = (
            EmployeePayroll.objects
            .select_related("employee", "employee__team", "employee__team__head")
            .filter(month__startswith=month)
        )

        payroll_by_employee = {
            p.employee_id: p for p in payrolls
        }

        # ----------------------------------
        # TEAM-WISE EXPORT
        # ----------------------------------
        teams = (
            Team.objects
            .select_related("head")
            .prefetch_related(
                Prefetch(
                    "employees",
                    queryset=Employee.objects.all()
                )
            )
        )

        assigned_employee_ids = set()

        for team in teams:
            team_emps = team.employees.all()
            if not team_emps:
                continue

            ws.append([])
            ws.append([
                f"TEAM: {team.name} | LEADER: {team.head.name if team.head else '—'}"
            ])
            write_headers()

            for emp in team_emps:
                payroll = payroll_by_employee.get(emp.id)
                if not payroll:
                    continue

                assigned_employee_ids.add(emp.id)
                roles = ", ".join(emp.roles.values_list("name", flat=True)) or "—"


                ws.append([
                    emp.login_id,
                    emp.name,
                    roles,
                    float(payroll.gross_salary),
                    float(payroll.net_salary),
                ])

        # ----------------------------------
        # UNASSIGNED EMPLOYEES
        # ----------------------------------
        unassigned = payrolls.exclude(employee_id__in=assigned_employee_ids)

        if unassigned.exists():
            ws.append([])
            ws.append(["UNASSIGNED EMPLOYEES"])
            write_headers()

            for p in unassigned:
                emp = p.employee
                ws.append([
                    emp.employee_code,
                    emp.name,
                    emp.designation,
                    float(p.gross_salary),
                    float(p.net_salary),
                ])

        # ----------------------------------
        # RESPONSE
        # ----------------------------------
        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = f'attachment; filename="payroll_{month}.xlsx"'
        wb.save(response)
        return response
    # -------------------------
    # Payslip PDF (clean, no-overlap layout)
    # -------------------------
    @action(detail=True, methods=["get"], url_path="payslip")
    def payslip(self, request, pk=None):
        payroll = self.get_object()
        emp = payroll.employee

        # PDF setup + margins
        left_margin = 30
        right_margin = 30
        top_margin = 30
        bottom_margin = 30

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=LETTER,
            leftMargin=left_margin,
            rightMargin=right_margin,
            topMargin=top_margin,
            bottomMargin=bottom_margin,
        )

        styles = getSampleStyleSheet()
        normal = styles["Normal"]
        normal.leading = 12
        heading = styles["Heading2"]
        heading.fontSize = 14
        small = styles["BodyText"]
        small.fontSize = 9

        # header style for table headers (explicit white text)
        header_style = ParagraphStyle(
            name="TableHeader",
            fontSize=9,
            textColor=colors.white,
            fontName="Helvetica-Bold",
            alignment=1,  # center
        )

        story = []

        # Header
        company_name = getattr(dj_settings, "COMPANY_NAME", "Loan Manager Pvt Ltd")
        company_cin = getattr(dj_settings, "COMPANY_CIN", "CIN: -")
        story.append(Paragraph(f"<b>{company_name}</b>", heading))
        story.append(Paragraph(company_cin, normal))
        story.append(Spacer(1, 8))

        month_label = payroll.month.strftime("%B %Y").upper()
        banner = Table(
            [[Paragraph(f"<b>PAYSLIP FOR THE MONTH OF {month_label}</b>", styles["BodyText"])]],
            colWidths=[doc.width],
        )
        banner.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E5E7EB")),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(banner)
        #story.append(Spacer(1, 10))

        # employee info grid (safe getters)
        doj = getattr(emp, "date_of_joining", None)
        doj_txt = doj.strftime("%Y-%m-%d") if hasattr(doj, "strftime") else (str(doj) if doj else "-")
        bank = emp.bank_name or "-"
        accno = emp.bank_account_no or "-"
        
        roles_qs = emp.roles.all()
        designation = ", ".join([r.name for r in roles_qs]) if roles_qs else "-"
        
        # designation = getattr(emp.roles, "name", "-")
        work_loc = emp.work_location or "-"
        work_days = getattr(payroll, "working_days", "-")
        lop_days = getattr(payroll, "unpaid_leave_days", "-")
        days_paid = getattr(payroll, "payable_days", "-")
        joined = emp.created_at
        uan = emp.uan_number or "-"

        info_table = Table(
            [
                ["Employee No", emp.login_id or "-", "Bank Name", bank],
                ["Name", emp.name or "-", "Bank A/C No", accno],
                ["Designation", designation, "Work Days", work_days],
                ["Work Location", work_loc, "LOP Days", lop_days],
                ["Date of Joining", joined, "Days Paid", days_paid],
                ["Provident Fund UAN No.", uan, "", ""],
            ],
            colWidths=[110, 170, 110, doc.width - (110 + 170 + 110)],
        )
        info_table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(info_table)
        #story.append(Spacer(1, 12))

        # ---- prepare content widths so nothing overflows ----
        content_width = doc.width  # available width inside margins
        # give ~62% to earnings, rest to deductions (tweakable)
        col_left = int(content_width * 0.62)
        col_right = int(content_width - col_left)

        # reserve amount column (right-aligned) inside each inner table
        amount_col_width = min(100, int(content_width * 0.18))  # amount column: typically small
        left_label_w = max(80, col_left - amount_col_width)
        right_label_w = max(80, col_right - amount_col_width)

        # local helper to make right-aligned number cell
        def right_num(val):
            return Paragraph(f'<para alignment="right">{money(val)}</para>', normal)

        # ---- Earnings inner table ----
        earnings_rows = [
            [Paragraph("Earnings", header_style), Paragraph("Amount (Rs)", header_style)]
        ]

        # Basic / prorated base
        basic_val = getattr(payroll, "prorated_base", None)
        if basic_val is None:
            basic_val = getattr(payroll, "base_salary", getattr(emp, "base_salary", 0))
        earnings_rows.append([Paragraph("Basic", normal), right_num(basic_val)])

        # HRA
        hra_val = getattr(payroll, "hra", getattr(emp, "hra", 0))
        earnings_rows.append([Paragraph("HRA", normal), right_num(hra_val)])

        # Individual allowances (fallback to payroll fields, then employee fields)
        conveyance_val = getattr(payroll, "conveyance_allowance", getattr(emp, "conveyance_allowance", 0))
        earnings_rows.append([Paragraph("Conveyance Allowance", normal), right_num(conveyance_val)])

        medical_val = getattr(payroll, "medical_reimbursement", getattr(emp, "medical_reimbursement", 0))
        earnings_rows.append([Paragraph("Medical Reimbursement", normal), right_num(medical_val)])

        uniform_val = getattr(payroll, "uniform_allowance", getattr(emp, "uniform_allowance", 0))
        earnings_rows.append([Paragraph("Uniform Allowance", normal), right_num(uniform_val)])

        food_val = getattr(payroll, "food_allowance", getattr(emp, "food_allowance", 0))
        earnings_rows.append([Paragraph("Food Allowance", normal), right_num(food_val)])

        special_val = getattr(payroll, "special_allowance", getattr(emp, "special_allowance", 0))
        earnings_rows.append([Paragraph("Special Allowance", normal), right_num(special_val)])

        arrear_val = getattr(payroll, "arrear_salary", getattr(emp, "arrear_salary", 0))
        earnings_rows.append([Paragraph("Arrear Salary", normal), right_num(arrear_val)])

        # If a combined other_allowances exists, show it as well (optional)
        other_allowances_val = getattr(payroll, "other_allowances", None)
        if other_allowances_val is not None:
            earnings_rows.append([Paragraph("Other Allowances (combined)", normal), right_num(other_allowances_val)])

        # Incentive and other earnings
        incentive_val = getattr(payroll, "incentive_amount", getattr(emp, "incentive_amount", 0))
        earnings_rows.append([Paragraph("Incentives", normal), right_num(incentive_val)])

        bonus_val = getattr(payroll, "bonus_amount", getattr(emp, "bonus_amount", 0))
        earnings_rows.append([Paragraph("Bonus", normal), right_num(bonus_val)])

        leave_encash_val = getattr(payroll, "leave_encashment_amount", getattr(emp, "leave_encashment_amount", 0))
        earnings_rows.append([Paragraph("Leave Encashment", normal), right_num(leave_encash_val)])

        overtime_val = getattr(payroll, "overtime_amount", getattr(emp, "overtime_amount", 0))
        earnings_rows.append([Paragraph("Overtime", normal), right_num(overtime_val)])

        night_shift_val = getattr(payroll, "night_shift_allowance", getattr(emp, "night_shift_allowance", 0))
        earnings_rows.append([Paragraph("Night Shift Allowance", normal), right_num(night_shift_val)])

        earnings_table = Table(earnings_rows, colWidths=[left_label_w, amount_col_width], hAlign="LEFT")
        earnings_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#FFFFFF")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E6E7EB")),
                    ("ALIGN", (1, 1), (1, -1), "RIGHT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )

        # ---- Deductions inner table ----
        deductions_rows = [
            [Paragraph("Deductions", header_style), Paragraph("Amount (Rs)", header_style)]
        ]

        tds_val = getattr(payroll, "tds_amount", getattr(emp, "tds_amount", 0))
        deductions_rows.append([Paragraph("TDS", normal), right_num(tds_val)])

        esi_val = getattr(payroll, "esi_employee_contribution", getattr(emp, "esi_employee_contribution", 0))
        deductions_rows.append([Paragraph("ESI Employee contribution", normal), right_num(esi_val)])

        pf_val = getattr(payroll, "pf_employee_contribution", getattr(emp, "pf_employee_contribution", 0))
        deductions_rows.append([Paragraph("PF Employee contribution", normal), right_num(pf_val)])

        lop_val = getattr(payroll, "lop_amount", getattr(emp, "lop_amount", 0))
        deductions_rows.append([Paragraph("LOP", normal), right_num(lop_val)])

        loan_val = getattr(payroll, "loan_repayment_amount", getattr(emp, "loan_repayment_amount", 0))
        deductions_rows.append([Paragraph("Loan Repayment", normal), right_num(loan_val)])

        labour_val = getattr(payroll, "labour_welfare_fund", getattr(emp, "labour_welfare_fund", 0))
        deductions_rows.append([Paragraph("Labour Welfare Fund", normal), right_num(labour_val)])

        other_deductions_val = getattr(payroll, "other_deductions", getattr(emp, "other_deductions", 0))
        deductions_rows.append([Paragraph("Other Deductions", normal), right_num(other_deductions_val)])

        deductions_table = Table(deductions_rows, colWidths=[right_label_w, amount_col_width], hAlign="LEFT")
        deductions_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#FFFFFF")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E6E7EB")),
                    ("ALIGN", (1, 1), (1, -1), "RIGHT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )

        # ---- Outer container: put the two inner tables side-by-side
        # ensure outer column widths sum to doc.width
        outer_col1 = left_label_w + amount_col_width
        outer_col2 = right_label_w + amount_col_width
        # last safety: if rounding produced different sum, adjust second column to fit exactly
        if (outer_col1 + outer_col2) != content_width:
            outer_col2 = content_width - outer_col1

        combined_table = Table([[earnings_table, deductions_table]], colWidths=[outer_col1, outer_col2])
        combined_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        story.append(combined_table)
        #story.append(Spacer(1, 12))

        # Totals row (distinct block)
        gross = dec(getattr(payroll, "gross_salary", 0))
        total_deduct = dec(getattr(payroll, "total_deductions", 0))
        net = dec(getattr(payroll, "net_salary", 0))

        totals = Table(
            [
                [
                    Paragraph("<b>Gross Salary</b>", normal),
                    Paragraph(f'<para alignment="right"><b>{money(gross)}</b></para>', normal),
                    Paragraph("<b>Gross Deduction</b>", normal),
                    Paragraph(f'<para alignment="right"><b>{money(total_deduct)}</b></para>', normal),
                ],
                [Paragraph("<b>Net Salary</b>", normal), Paragraph(f'<para alignment="right"><b>{money(net)}</b></para>', normal), "", ""],
            ],
            colWidths=[140, 120, 140, content_width - (140 + 120 + 140)],
        )
        totals.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#94A3B8")),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E6E7EB")),
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("ALIGN", (3, 0), (3, -1), "RIGHT"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                ]
            )
        )
        story.append(totals)
        #story.append(Spacer(1, 8))

        story.append(Paragraph("<i>Note: This is a system generated document and will not have a signature.</i>", small))

        # build and return response
        doc.build(story)
        pdf = buffer.getvalue()
        buffer.close()
        resp = HttpResponse(pdf, content_type="application/pdf")
        resp["Content-Disposition"] = f'attachment; filename="payslip_{emp.login_id or emp.id}_{month_label}.pdf"'
        return resp
