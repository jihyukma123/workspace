import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  getRelativeTime,
  formatFullDateTime,
  formatShortDate,
  formatReminderDateTime,
} from "@/lib/date-format";

type DateInput = Date | string | number;

interface RelativeTimeProps {
  /** 표시할 날짜 */
  date: DateInput;
  /** 스타일 클래스 */
  className?: string;
  /** 상대 시간 대신 짧은 날짜 포맷 사용 (예: Jan 15) */
  shortFormat?: boolean;
  /** 리마인더 형식 (날짜 + 시간) */
  reminderFormat?: boolean;
  /** 자동 업데이트 여부 (기본: true) */
  autoUpdate?: boolean;
  /** 업데이트 간격 (ms, 기본: 60000 = 1분) */
  updateInterval?: number;
  /** 툴팁 비활성화 */
  disableTooltip?: boolean;
}

/**
 * 일관된 날짜 표시 컴포넌트
 * - 상대적 시간 또는 짧은 날짜 표시
 * - 호버 시 전체 날짜/시간 표시 (툴팁)
 * - 사용자 locale 자동 반영
 */
export function RelativeTime({
  date,
  className,
  shortFormat = false,
  reminderFormat = false,
  autoUpdate = true,
  updateInterval = 60000,
  disableTooltip = false,
}: RelativeTimeProps) {
  const [, setTick] = useState(0);

  // 자동 업데이트 (상대 시간이 변경될 수 있으므로)
  useEffect(() => {
    if (!autoUpdate || shortFormat || reminderFormat) return;

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [autoUpdate, updateInterval, shortFormat, reminderFormat]);

  const displayText = reminderFormat
    ? formatReminderDateTime(date)
    : shortFormat
      ? formatShortDate(date)
      : getRelativeTime(date);

  const fullDateTime = formatFullDateTime(date);

  if (disableTooltip) {
    return <span className={cn(className)}>{displayText}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("cursor-default", className)}>{displayText}</span>
      </TooltipTrigger>
      <TooltipContent>
        <span>{fullDateTime}</span>
      </TooltipContent>
    </Tooltip>
  );
}
