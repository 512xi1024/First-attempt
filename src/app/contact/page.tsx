import SiteHeader from "@/components/site-header";
import CopyButton from "@/components/copy-button";
import { SITE } from "@/lib/config";

export default function ContactPage() {
  const c = SITE.contact;

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <div className="animate-fade-in-up px-10 pb-24 pt-14 motion-reduce:animate-none lg:px-20 xl:px-24 2xl:px-32">
        {/* ===== 页头 ===== */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-stone-600">
              Contact — 来信与来意
            </p>
            <h1 className="mt-3 text-3xl tracking-[0.28em] text-stone-100 sm:text-4xl">
              联系
            </h1>
          </div>
          <p className="hidden pb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-stone-600 lg:block">
            常年开放
          </p>
        </div>
        <div
          className="mt-7 h-px w-full bg-gradient-to-r from-stone-700/80 via-stone-800/60 to-transparent"
          aria-hidden="true"
        />

        <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-20 xl:gap-28">
          {/* ===== 左：说明 + 联系方式 ===== */}
          <div>
            <p className="text-lg leading-8 text-stone-300">
              写信，或是扫码。
              <br />
              两条路，都通到同一间事务所。
            </p>
            <p className="mt-5 max-w-[46ch] text-sm leading-7 text-stone-500">
              关于她的经历、作品与近况，都可以从这里问起。来信请注明来意，回信会快些。
            </p>

            <dl className="mt-12 border-t border-stone-800/70">
              {/* 邮箱 */}
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-b border-stone-800/70 py-6">
                <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
                  邮箱 · QQ Mail
                </dt>
                <dd className="flex items-center gap-3">
                  <a
                    href={`mailto:${c.email}`}
                    className="cursor-target text-[15px] tracking-wide text-amber-100 underline decoration-stone-700 underline-offset-[6px] transition hover:decoration-amber-200/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/70"
                  >
                    {c.email}
                  </a>
                  <CopyButton value={c.email} />
                </dd>
              </div>

              {/* QQ */}
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-b border-stone-800/70 py-6">
                <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
                  QQ
                </dt>
                <dd className="flex items-center gap-3">
                  <span className="text-[15px] tabular-nums tracking-wide text-stone-200">
                    {c.qq}
                  </span>
                  <CopyButton value={c.qq} />
                </dd>
              </div>

              {/* 微信 */}
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-b border-stone-800/70 py-6">
                <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
                  微信 · WeChat
                </dt>
                <dd className="flex items-baseline gap-3 text-sm text-stone-400">
                  扫码添加
                  <span
                    className="font-mono text-[11px] text-stone-600"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </dd>
              </div>
            </dl>

            <p className="mt-8 text-xs leading-6 text-stone-500">{c.note}</p>
          </div>

          {/* ===== 右：微信二维码卡片（纸质感，保证可扫） ===== */}
          <figure className="w-full max-w-[340px] lg:justify-self-end">
            <div className="rounded-sm border border-stone-700/60 bg-[#eae7db] p-4 shadow-2xl shadow-black/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.wechatQr}
                alt="小溪的微信二维码，扫码添加好友"
                width={520}
                height={520}
                className="w-full rounded-[2px] bg-white"
              />
              <figcaption className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-[#5b5348]">
                <span>WeChat</span>
                <span>扫一扫</span>
              </figcaption>
            </div>
            <p className="mt-4 text-xs leading-6 text-stone-500">
              二维码失效时，邮件告知即可换新。
            </p>
          </figure>
        </div>
      </div>
    </main>
  );
}
