import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            되는 시간
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">개인정보처리방침</h1>
        <p className="text-sm text-muted-foreground mb-8">
          시행일: 2026년 3월 11일
        </p>

        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">
              1. 수집하는 개인정보 항목 및 목적
            </h2>
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="border border-border px-3 py-2 text-left">수집 항목</th>
                  <th className="border border-border px-3 py-2 text-left">수집 목적</th>
                  <th className="border border-border px-3 py-2 text-left">필수 여부</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-3 py-2">이름</td>
                  <td className="border border-border px-3 py-2">약속 참여자 식별</td>
                  <td className="border border-border px-3 py-2">필수</td>
                </tr>
                <tr>
                  <td className="border border-border px-3 py-2">이메일</td>
                  <td className="border border-border px-3 py-2">
                    약속 주최자 확인, 내 약속 조회
                  </td>
                  <td className="border border-border px-3 py-2">
                    주최자: 필수 / 참여자: 선택
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              2. 개인정보 보유 및 이용 기간
            </h2>
            <p className="text-sm text-muted-foreground">
              수집된 개인정보는 약속이 삭제될 때까지 보유되며, 약속 삭제 시 모든
              관련 데이터(참여자 정보, 응답)가 즉시 파기됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              3. 개인정보의 제3자 제공
            </h2>
            <p className="text-sm text-muted-foreground">
              수집된 개인정보는 제3자에게 제공하지 않습니다. 다만, 같은 약속의
              참여자에게 이름이 표시됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              4. 개인정보 파기 절차
            </h2>
            <p className="text-sm text-muted-foreground">
              약속 주최자가 약속을 삭제하면 해당 약속에 포함된 모든 개인정보가
              데이터베이스에서 즉시 삭제됩니다(Cascade 삭제).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              5. 이용자의 권리
            </h2>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>약속 주최자는 언제든 약속을 삭제하여 개인정보를 파기할 수 있습니다.</li>
              <li>참여자는 자신의 응답을 수정하거나, 주최자에게 삭제를 요청할 수 있습니다.</li>
              <li>
                개인정보 관련 문의:{" "}
                <a
                  href="mailto:hwang@ulsan.ac.kr"
                  className="text-foreground underline"
                >
                  hwang@ulsan.ac.kr
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              6. 개인정보 보호 책임자
            </h2>
            <p className="text-sm text-muted-foreground">
              이메일: hwang@ulsan.ac.kr
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
