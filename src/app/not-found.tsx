import { BRAND_NAME } from "@/lib/brand";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="card p-6 text-center">
        <p className="text-2xl font-bold text-brand">{BRAND_NAME}</p>
        <h1 className="mt-4 text-2xl font-bold text-brand-dark">
          약속방을 찾을 수 없습니다
        </h1>
        <p className="mt-2 text-sm text-muted">
          링크가 올바른지 확인해주세요.
        </p>
        <a href="/" className="btn-primary mt-6 inline-block">
          홈으로 돌아가기
        </a>
      </div>
    </main>
  );
}
