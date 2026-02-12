import { MainLayout } from "@/components/layout/MainLayout";
import { PrimaryColorSetting } from "@/components/settings/PrimaryColorSetting";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SettingsAppearance() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className={cn("h-screen flex flex-col")}>
        <header className={cn("flex items-center justify-between px-6 py-4 border-b border-border bg-background")}>
          <div className={cn("flex items-start gap-3")}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("mt-0.5")}
              onClick={() => navigate("/settings")}
            >
              <ArrowLeft className={cn("w-4 h-4 mr-2")} />
              Settings
            </Button>
            <div>
              <h1 className={cn("font-mono text-lg font-bold text-primary")}>Appearance</h1>
            <p className={cn("text-sm text-muted-foreground")}>
              앱의 색상 및 표시 옵션을 설정합니다.
            </p>
            </div>
          </div>
        </header>

        <div className={cn("flex-1 min-h-0 p-6")}>
          <div className={cn("max-w-2xl")}>
            <Card>
              <CardContent className={cn("p-4")}>
                <PrimaryColorSetting />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
