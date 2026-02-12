import { MainLayout } from "@/components/layout/MainLayout";
import { FeedbackList } from "@/components/settings/FeedbackList";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SettingsFeedback() {
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
              <h1 className={cn("font-mono text-lg font-bold text-primary")}>Feedback</h1>
            <p className={cn("text-sm text-muted-foreground")}>
              Send Feedback로 저장된 내용을 확인합니다.
            </p>
            </div>
          </div>
        </header>

        <div className={cn("flex-1 min-h-0 p-6")}>
          <div className={cn("max-w-2xl")}>
            <FeedbackList />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
