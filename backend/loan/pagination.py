# yourapp/pagination.py
from rest_framework.pagination import PageNumberPagination

class CustomPageNumberPagination(PageNumberPagination):
    page_size = 5  # default
    page_size_query_param = 'page_size'
    max_page_size = 100  # or whatever you want as a max