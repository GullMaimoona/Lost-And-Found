const fields = {
  title: { label: "Item name", maxLength: 120 },
  description: { label: "Description", maxLength: 2000 },
  category: { label: "Category", maxLength: 60 },
  location: { label: "Location", maxLength: 180 },
  color: { label: "Color", maxLength: 100 },
};

const imagePattern = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const maxImageLength = 7_100_000;

function validateItemPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { value: {}, errors: ["Request body must be a JSON object."] };
  }

  const value = {};
  for (const [field, { label, maxLength }] of Object.entries(fields)) {
    const raw = payload[field];
    if (typeof raw !== "string" || !raw.trim()) {
      errors.push(`${label} is required.`);
      continue;
    }

    value[field] = raw.trim();
    if (value[field].length > maxLength) {
      errors.push(`${label} must be ${maxLength} characters or fewer.`);
    }
  }

  if (payload.status !== "Lost" && payload.status !== "Found") {
    errors.push('Status must be either "Lost" or "Found".');
  } else {
    value.status = payload.status;
  }

  if (typeof payload.date !== "string" || !payload.date.trim()) {
    errors.push("Date is required.");
  } else if (Number.isNaN(Date.parse(payload.date))) {
    errors.push("Date must be a valid date.");
  } else {
    value.date = payload.date;
  }

  if (payload.image !== undefined && payload.image !== null && payload.image !== "") {
    if (typeof payload.image !== "string" || payload.image.length > maxImageLength || !imagePattern.test(payload.image)) {
      errors.push("Image must be a JPG, PNG, or WebP data URL no larger than 5 MB.");
    } else {
      value.image = payload.image;
    }
  }

  if (typeof payload.contactEmail !== "string" || !payload.contactEmail.trim()) {
    errors.push("Contact email is required.");
  } else {
    const contactEmail = payload.contactEmail.trim().toLowerCase();
    if (contactEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      errors.push("Enter a valid contact email.");
    } else {
      value.contactEmail = contactEmail;
    }
  }

  return { value, errors };
}

module.exports = { validateItemPayload };
