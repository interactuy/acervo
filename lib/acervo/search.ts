export type SearchField = {
  value: string | number | null | undefined;
  weight?: number;
};

export function normalizeSearchText(value: string | number | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9ñ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeSearch(value: string) {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

export function getSearchScore(query: string, fields: SearchField[]) {
  const tokens = tokenizeSearch(query);

  if (tokens.length === 0) {
    return 0;
  }

  const normalizedFields = fields
    .map((field) => ({
      value: normalizeSearchText(field.value),
      compactValue: normalizeSearchText(field.value).replace(/\s+/g, ""),
      weight: field.weight ?? 1,
    }))
    .filter((field) => field.value.length > 0);
  const phrase = tokens.join(" ");
  const compactPhrase = phrase.replace(/\s+/g, "");
  let score = 0;

  for (const token of tokens) {
    const compactToken = token.replace(/\s+/g, "");
    let bestTokenScore = 0;

    for (const field of normalizedFields) {
      if (field.value === token) {
        bestTokenScore = Math.max(bestTokenScore, field.weight * 12);
      } else if (field.value.startsWith(token)) {
        bestTokenScore = Math.max(bestTokenScore, field.weight * 9);
      } else if (field.value.includes(` ${token}`)) {
        bestTokenScore = Math.max(bestTokenScore, field.weight * 7);
      } else if (field.value.includes(token)) {
        bestTokenScore = Math.max(bestTokenScore, field.weight * 5);
      } else if (field.compactValue.includes(compactToken)) {
        bestTokenScore = Math.max(bestTokenScore, field.weight * 3);
      }
    }

    if (bestTokenScore === 0) {
      return 0;
    }

    score += bestTokenScore;
  }

  for (const field of normalizedFields) {
    if (
      field.value.includes(phrase) ||
      field.compactValue.includes(compactPhrase)
    ) {
      score += field.weight * 10;
    }
  }

  return score;
}

export function hasSearchQuery(value: string) {
  return tokenizeSearch(value).length > 0;
}
