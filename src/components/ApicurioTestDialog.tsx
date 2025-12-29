import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { ApicurioConnectionTest } from "./ApicurioConnectionTest";

interface ApicurioTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApicurioTestDialog({ open, onOpenChange }: ApicurioTestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-hidden">
        <DialogTitle className="sr-only">API Connection Diagnostics</DialogTitle>
        <DialogDescription className="sr-only">
          Test and diagnose connections to Apicurio Registry and BFS API endpoints
        </DialogDescription>
        <ApicurioConnectionTest />
      </DialogContent>
    </Dialog>
  );
}
