from lxml import etree
from typing import Any, Callable, Iterable

def _cast(value: str, fn: Callable[[str], Any]) -> Any:
    if value is None:
        return None
    try:
        return fn(value)
    except Exception:
        return value  # fallback to raw value if casting fails

def extract_single(tree, spec, namespaces=None):
    data = {}
    for field in spec:
        result = tree.xpath(field.xpath, namespaces=namespaces)
        if result:
            value = result[0]
            if hasattr(value, 'text'):
                value = value.text
            data[field.model_field] = field.cast(value)
    return data

def extract_many(tree: etree._ElementTree, section, namespaces=None):
    """Yield dicts for each child instance, using namespace-aware XPath."""
    for parent in tree.findall(section.parent_xpath, namespaces=namespaces):
        row = {}
        for field in section.children:
            if field.attr:
                value = parent.get(field.attr)
            else:
                result = parent.xpath(field.xpath, namespaces=namespaces)
                value = result[0].text if result else None
            row[field.model_field] = _cast(value, field.cast)
        yield row
