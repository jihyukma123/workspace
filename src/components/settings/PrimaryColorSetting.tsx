import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePrimaryColor } from "@/hooks/use-primary-color";
import {
  isPrimaryColorId,
  PRIMARY_COLOR_OPTIONS,
} from "@/lib/primary-color";
import { cn } from "@/lib/utils";

export function PrimaryColorSetting() {
  const { primaryColorId, resetPrimaryColor, setPrimaryColor } =
    usePrimaryColor();

  return (
    <div className={cn("space-y-2")}>
      <div className={cn("flex items-center justify-between gap-3")}>
        <div className={cn("space-y-0.5")}>
          <p className={cn("text-sm font-medium text-foreground")}>Primary color</p>
          <p className={cn("text-xs text-muted-foreground")}>
            Pantone Color of the Year (2016–2025)
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={cn("transition-all duration-200")}
          onClick={resetPrimaryColor}
          disabled={!primaryColorId}
        >
          Reset
        </Button>
      </div>

      <Select
        value={primaryColorId ?? undefined}
        onValueChange={(value) => {
          if (isPrimaryColorId(value)) {
            setPrimaryColor(value);
          }
        }}
      >
        <SelectTrigger className={cn("transition-all duration-200")}>
          <div className={cn("flex min-w-0 items-center gap-2")}>
            <span
              className={cn("h-3 w-3 rounded-full border border-border")}
              style={{ backgroundColor: "hsl(var(--primary))" }}
            />
            <SelectValue placeholder="Default (Teal)" />
          </div>
        </SelectTrigger>
        <SelectContent className={cn("bg-popover border-border")}>
          {PRIMARY_COLOR_OPTIONS.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              <span className={cn("flex items-center gap-2")}>
                <span
                  className={cn("h-3 w-3 rounded-full border border-border")}
                  style={{ backgroundColor: `hsl(var(${option.cssVar}))` }}
                />
                <span>{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

