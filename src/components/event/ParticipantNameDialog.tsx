"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ParticipantNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNames: string[];
  onSubmit: (name: string, email: string) => void;
}

export default function ParticipantNameDialog({
  open,
  onOpenChange,
  existingNames,
  onSubmit,
}: ParticipantNameDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name.trim(), email.trim());
    setName("");
    setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>참여자 정보</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="participant-name">이름</Label>
            <Input
              id="participant-name"
              placeholder="예: 홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="participant-email">이메일 (선택)</Label>
            <Input
              id="participant-email"
              type="email"
              placeholder="예: hong@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              내 이벤트 목록 확인 시 사용됩니다
            </p>
          </div>
          {existingNames.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                이미 응답한 이름을 선택하면 수정할 수 있어요
              </p>
              <div className="flex flex-wrap gap-1">
                {existingNames.map((n) => (
                  <button
                    key={n}
                    onClick={() => setName(n)}
                    className="px-2 py-1 text-xs bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
