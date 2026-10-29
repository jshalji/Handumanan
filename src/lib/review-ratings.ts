export type RatingValue = { rating?: unknown };

export type RatingCounts = Record<1 | 2 | 3 | 4 | 5, number>;

type RatingLoadState = {
  isLoading: boolean;
  isAvailable: boolean;
  error: unknown | null;
};

export type RatingSummaryState =
  | { status: 'loading'; average: null; count: 0; counts: RatingCounts }
  | { status: 'unavailable'; average: null; count: 0; counts: RatingCounts }
  | { status: 'empty'; average: null; count: 0; counts: RatingCounts }
  | { status: 'rated'; average: number; count: number; counts: RatingCounts };

export function groupReviewsBySiteId<T extends RatingValue & { __documentPath?: unknown }>(
  reviews: readonly T[] | null | undefined,
): Map<string, T[]> {
  const reviewsBySiteId = new Map<string, T[]>();

  for (const review of reviews || []) {
    if (typeof review.__documentPath !== 'string') continue;
    const pathParts = review.__documentPath.split('/');
    if (pathParts.length !== 4 || pathParts[0] !== 'heritageSites' || pathParts[2] !== 'reviews') continue;

    const siteId = pathParts[1];
    const siteReviews = reviewsBySiteId.get(siteId) || [];
    siteReviews.push(review);
    reviewsBySiteId.set(siteId, siteReviews);
  }

  return reviewsBySiteId;
}

export function isValidRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 5;
}

export function getRatingSummaryState(
  reviews: readonly RatingValue[] | null | undefined,
  loadState: RatingLoadState,
): RatingSummaryState {
  const emptyCounts: RatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  if (loadState.isLoading) {
    return { status: 'loading', average: null, count: 0, counts: emptyCounts };
  }
  if (loadState.error || !loadState.isAvailable || !reviews) {
    return { status: 'unavailable', average: null, count: 0, counts: emptyCounts };
  }

  const validRatings = reviews.map(review => review.rating).filter(isValidRating);
  if (validRatings.length === 0) {
    return { status: 'empty', average: null, count: 0, counts: emptyCounts };
  }

  const counts: RatingCounts = { ...emptyCounts };
  validRatings.forEach(rating => {
    const star = Math.round(rating) as 1 | 2 | 3 | 4 | 5;
    counts[star]++;
  });

  return {
    status: 'rated',
    average: validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length,
    count: validRatings.length,
    counts,
  };
}
