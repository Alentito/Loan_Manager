# loans/specs.py
from collections import namedtuple

Field   = namedtuple("Field",   "xpath attr model_field cast")
Section = namedtuple("Section", "parent_xpath children")

LOAN_SPEC = [
    Field(".//LOAN_IDENTIFIERS/LOAN_IDENTIFIER/LoanIdentifier",    None, "external_id", str),
    Field(".//LoanPurposeType",   None, "purpose",     str),
    Field(".//LoanAmortizationType", None, "amortization", str),
    Field(".//NoteAmount",        None, "note_amount",  float),
    Field(".//NoteRatePercent",   None, "note_rate",    float),
    Field(".//LoanTermMonths",    None, "term_months",  int),
    Field(".//APPLICATION/Date",  None, "application_date", str),
]

ASSET_SECTION = Section(
    parent_xpath=".//ASSETS/ASSET",
    children=[
        Field("./@SequenceNumber",        None, "sequence",  int),
        Field("./ASSET_DETAIL/AssetType", None, "type",      str),
        Field("./ASSET_DETAIL/AssetCashOrMarketValueAmount",
              None, "value", float),
    ],
)

LIABILITY_SECTION = Section(
    parent_xpath=".//LIABILITIES/LIABILITY",
    children=[
        Field("./@SequenceNumber", None, "sequence", int),
        Field("./LIABILITY_DETAIL/LiabilityType", None, "type", str),
        Field("./LIABILITY_DETAIL/"
              "LiabilityUnpaidBalanceAmount", None, "balance", float),
        Field("./LIABILITY_DETAIL/"
              "LiabilityMonthlyPaymentAmount", None, "payment", float),
    ],
)

BORROWER_SECTION = Section(
    parent_xpath=".//PARTIES/PARTY",
    children=[
        Field("./INDIVIDUAL/NAME/FirstName", None, "first_name", str),
        Field("./INDIVIDUAL/NAME/LastName",  None, "last_name", str),
        Field("./INDIVIDUAL/SSN",            None, "ssn", str),
        Field("./INDIVIDUAL/BirthDate",      None, "dob", str),
    ],
)
