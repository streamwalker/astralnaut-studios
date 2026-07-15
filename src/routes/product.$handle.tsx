import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { RightsNotice } from "@/components/rights-notice";
import { CartDrawer } from "@/components/cart-drawer";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  PRODUCT_BY_HANDLE_QUERY,
  storefrontApiRequest,
  type ShopifyProduct,
} from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { OG_DEFAULT_IMAGE, OG_DEFAULT_ALT, OG_DEFAULT_WIDTH, OG_DEFAULT_HEIGHT, SITE_URL, absUrl } from "@/lib/seo";

async function fetchProduct(handle: string): Promise<ShopifyProduct["node"] | null> {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  return data?.data?.product ?? null;
}

const productQuery = (handle: string) =>
  queryOptions({
    queryKey: ["shop", "product", handle],
    queryFn: () => fetchProduct(handle),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/product/$handle")({
  head: ({ params, loaderData }) => {
    const product = loaderData as ShopifyProduct["node"] | null | undefined;
    const title = product?.title ?? params.handle;
    const desc = product?.description?.slice(0, 200) ?? "Official Astralnaut Studios merch.";
    const imgSrc = product?.images?.edges?.[0]?.node?.url;
    const img = imgSrc ? absUrl(imgSrc) : OG_DEFAULT_IMAGE;
    const imgAlt = product?.images?.edges?.[0]?.node?.altText ?? OG_DEFAULT_ALT;
    const url = `${SITE_URL}/product/${params.handle}`;
    return {
      meta: [
        { title: `${title} — Astralnaut Studios Shop` },
        { name: "description", content: desc },
        { property: "og:title", content: `${title} — Astralnaut Studios Shop` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { property: "og:image", content: img },
        ...(imgSrc ? [] : [
          { property: "og:image:width", content: OG_DEFAULT_WIDTH },
          { property: "og:image:height", content: OG_DEFAULT_HEIGHT },
        ]),
        { property: "og:image:alt", content: imgAlt },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: img },
        { name: "twitter:image:alt", content: imgAlt },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(productQuery(params.handle)),
  component: ProductPage,
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-black">Product not found</h1>
        <Link to="/shop" className="mt-6 inline-block text-[var(--neon)]">
          ← Back to shop
        </Link>
      </div>
    </div>
  ),
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(handle));
  if (!product) throw notFound();

  const variants = product.variants.edges.map((e) => e.node);
  const options = product.options;
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const first = variants[0]?.selectedOptions ?? [];
    return Object.fromEntries(first.map((o) => [o.name, o.value]));
  });
  const [imgIdx, setImgIdx] = useState(0);

  const variant = useMemo(() => {
    return (
      variants.find((v) =>
        v.selectedOptions.every((o) => selected[o.name] === o.value),
      ) ?? variants[0]
    );
  }, [variants, selected]);

  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);

  const handleAdd = async () => {
    if (!variant) return;
    const productWrap: ShopifyProduct = { node: product };
    await addItem({
      product: productWrap,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions,
    });
  };

  const images = product.images.edges;
  const mainImg = images[imgIdx]?.node ?? images[0]?.node;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/shop" className="text-sm text-[var(--mute)] hover:text-[var(--neon)]">
            ← Back to shop
          </Link>
          <CartDrawer />
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="mx-auto aspect-square w-full max-w-[720px] overflow-hidden rounded-2xl border border-[var(--border-line)] bg-black p-4">
              {mainImg ? (
                <img
                  src={mainImg.url}
                  alt={mainImg.altText ?? product.title}
                  className="h-full w-full object-contain"
                />
              ) : null}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((e, i) => (
                  <button
                    key={e.node.url}
                    onClick={() => setImgIdx(i)}
                    className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border ${
                      i === imgIdx ? "border-[var(--neon)]" : "border-[var(--border-line)]"
                    }`}
                  >
                    <img src={e.node.url} alt="" className="h-full w-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-black md:text-4xl">{product.title}</h1>
            <p className="mt-2 text-2xl font-bold">
              {variant?.price.currencyCode} {parseFloat(variant?.price.amount ?? "0").toFixed(2)}
            </p>
            <p className="mt-4 whitespace-pre-line text-[var(--ink2)]">{product.description}</p>

            <div className="mt-6 space-y-4">
              {options.map((opt) => (
                <div key={opt.name}>
                  <div className="mb-2 text-xs font-bold uppercase tracking-[2px] text-[var(--mute)]">
                    {opt.name}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((v) => {
                      const active = selected[opt.name] === v;
                      return (
                        <button
                          key={v}
                          onClick={() => setSelected((s) => ({ ...s, [opt.name]: v }))}
                          className={`rounded-md border px-4 py-2 text-sm font-medium ${
                            active
                              ? "border-[var(--neon)] bg-[var(--neon)]/10 text-[var(--neon)]"
                              : "border-[var(--border-line)] text-[var(--ink2)] hover:border-white/30"
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleAdd}
              size="lg"
              className="mt-8 w-full"
              disabled={isLoading || !variant?.availableForSale}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : variant?.availableForSale ? (
                "Add to cart"
              ) : (
                "Sold out"
              )}
            </Button>
          </div>
        </div>
        <RightsNotice variant="product" title={product.title} />
      </div>
      <SiteFooter />
    </div>
  );
}
