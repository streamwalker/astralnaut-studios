import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { CartDrawer } from "@/components/cart-drawer";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  PRODUCT_BY_HANDLE_QUERY,
  storefrontApiRequest,
  type ShopifyProduct,
} from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

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
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle} — Astralnaut Studios Shop` },
      { property: "og:title", content: `${params.handle} — Astralnaut Studios Shop` },
    ],
  }),
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
            <div className="aspect-square overflow-hidden rounded-2xl border border-[var(--border-line)] bg-black">
              {mainImg ? (
                <img
                  src={mainImg.url}
                  alt={mainImg.altText ?? product.title}
                  className="h-full w-full object-cover"
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
                    <img src={e.node.url} alt="" className="h-full w-full object-cover" />
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
      </div>
      <SiteFooter />
    </div>
  );
}
