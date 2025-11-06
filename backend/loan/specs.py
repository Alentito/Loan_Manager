from collections import namedtuple

# Namespace for MISMO XML (standard for 3.x schemas)
NAMESPACES = {"m": "http://www.mismo.org/residential/2009/schemas"}

Field   = namedtuple("Field",   "xpath attr model_field cast")
Section = namedtuple("Section", "parent_xpath children")

# Loan-level fields
LOAN_SPEC = [
    Field(".//m:LOAN_IDENTIFIERS/m:LOAN_IDENTIFIER/m:LoanIdentifier", None, "external_id", str),
    Field(".//m:LoanPurposeType",        None, "purpose",         str),
    Field(".//m:LoanAmortizationType",   None, "amortization",    str),
    Field(".//m:NoteAmount",             None, "note_amount",     float),
    Field(".//m:NoteRatePercent",        None, "note_rate",       float),
    Field(".//m:LoanTermMonths",         None, "term_months",     int),
    Field(".//m:APPLICATION/m:Date",     None, "application_date",str),
]

# Borrower-level fields
BORROWER_SECTION = Section(
    parent_xpath=".//m:PARTIES/m:PARTY",
    children=[
        Field("m:INDIVIDUAL/m:NAME/m:FirstName", None, "first_name", str),
        Field("m:INDIVIDUAL/m:NAME/m:LastName",  None, "last_name", str),
        Field("m:INDIVIDUAL/m:SSN",              None, "ssn", str),
        Field("m:INDIVIDUAL/m:BirthDate",        None, "dob", str),
    ],
)
