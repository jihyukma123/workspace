/**
 * 일관된 날짜 포맷 유틸리티
 * - 상대적 시간 표시 (2시간 전, 어제 등)
 * - 전체 날짜/시간 포맷
 * - 사용자 locale 지원
 */

type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  if (input instanceof Date) return input;
  return new Date(input);
}

/**
 * 상대적 시간을 반환합니다.
 * 예: "방금 전", "5분 전", "2시간 전", "어제", "3일 전", "2주 전", "1달 전", "2025년 1월 15일"
 */
export function getRelativeTime(
  date: DateInput,
  locale: string = navigator.language,
): string {
  const now = new Date();
  const targetDate = toDate(date);
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  // Intl.RelativeTimeFormat 사용
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  // 미래 날짜인 경우
  if (diffMs < 0) {
    const futureDiffSeconds = Math.abs(diffSeconds);
    const futureDiffMinutes = Math.abs(diffMinutes);
    const futureDiffHours = Math.abs(diffHours);
    const futureDiffDays = Math.abs(diffDays);

    if (futureDiffSeconds < 60) {
      return rtf.format(futureDiffSeconds, "second");
    }
    if (futureDiffMinutes < 60) {
      return rtf.format(futureDiffMinutes, "minute");
    }
    if (futureDiffHours < 24) {
      return rtf.format(futureDiffHours, "hour");
    }
    if (futureDiffDays < 7) {
      return rtf.format(futureDiffDays, "day");
    }
    if (futureDiffDays < 30) {
      return rtf.format(Math.ceil(futureDiffDays / 7), "week");
    }
    // 먼 미래는 전체 날짜 표시
    return formatFullDate(targetDate, locale);
  }

  // 과거 날짜
  if (diffSeconds < 60) {
    return rtf.format(-diffSeconds, "second");
  }
  if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, "minute");
  }
  if (diffHours < 24) {
    return rtf.format(-diffHours, "hour");
  }
  if (diffDays < 7) {
    return rtf.format(-diffDays, "day");
  }
  if (diffWeeks < 4) {
    return rtf.format(-diffWeeks, "week");
  }
  if (diffMonths < 12) {
    return rtf.format(-diffMonths, "month");
  }

  // 1년 이상 전이면 전체 날짜 표시
  return formatFullDate(targetDate, locale);
}

/**
 * 짧은 날짜 포맷을 반환합니다.
 * 예: "Jan 15" (영어), "1월 15일" (한국어)
 */
export function formatShortDate(
  date: DateInput,
  locale: string = navigator.language,
): string {
  const targetDate = toDate(date);
  return targetDate.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

/**
 * 전체 날짜 포맷을 반환합니다.
 * 예: "Jan 15, 2025" (영어), "2025년 1월 15일" (한국어)
 */
export function formatFullDate(
  date: DateInput,
  locale: string = navigator.language,
): string {
  const targetDate = toDate(date);
  return targetDate.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * 전체 날짜 및 시간 포맷을 반환합니다.
 * 예: "Jan 15, 2025, 3:30 PM" (영어), "2025년 1월 15일 오후 3:30" (한국어)
 */
export function formatFullDateTime(
  date: DateInput,
  locale: string = navigator.language,
): string {
  const targetDate = toDate(date);
  return targetDate.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 시간만 포맷합니다.
 * 예: "3:30 PM" (영어), "오후 3:30" (한국어)
 */
export function formatTime(
  date: DateInput,
  locale: string = navigator.language,
): string {
  const targetDate = toDate(date);
  return targetDate.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 리마인더용 날짜/시간 포맷 (짧은 날짜 + 시간)
 * 예: "Jan 15, 3:30 PM" (영어), "1월 15일 오후 3:30" (한국어)
 */
export function formatReminderDateTime(
  date: DateInput,
  locale: string = navigator.language,
): string {
  const targetDate = toDate(date);
  return targetDate.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
