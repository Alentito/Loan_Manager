// src/utils/formData.js
export function objectToFormData(obj, form = new FormData(), namespace = '') {
  for (const property in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, property)) continue;
    const formKey = namespace ? `${namespace}[${property}]` : property;
    const value = obj[property];

    if (value === undefined || value === null) continue;

    // File or Blob -> append directly
    if (value instanceof File || value instanceof Blob) {
      form.append(formKey, value);
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (v instanceof File || v instanceof Blob) {
          form.append(`${formKey}[]`, v);
        } else if (typeof v === 'object') {
          form.append(`${formKey}[${i}]`, JSON.stringify(v));
        } else {
          form.append(`${formKey}[]`, v);
        }
      });
    } else if (typeof value === 'object') {
      // nested -> recurse
      objectToFormData(value, form, formKey);
    } else {
      form.append(formKey, value);
    }
  }
  return form;
}
