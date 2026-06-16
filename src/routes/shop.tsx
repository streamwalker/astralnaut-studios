import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { RightsNotice } from "@/components/rights-notice";
import { CartDrawer } from "@/components/cart-drawer";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, ExternalLink } from "lucide-react";
import {
  STOREFRONT_QUERY,
  storefrontApiRequest,
  type ShopifyProduct,
} from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

const TIKTOK_SHOP_URL = "https://www.tiktok.com/@astralnautstudios";

async function fetchProducts(): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest(STOREFRONT_QUERY, { first: 50, query: null });
  return data?.data?.products?.edges ?? [];
}

const productsQuery = queryOptions({
  queryKey: ["shop", "products"],
  queryFn: fetchProducts,
  staleTime: 60_000,
});

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Astralnaut Studios Merch" },
      {
        name: "description",
        content:
          "Official Astralnaut Studios tees — Children of Aquarius and Release the X-Files designs. Ships from our Shopify storefront.",
      },
      { property: "og:title", content: "Shop — Astralnaut Studios" },
      { property: "og:description", content: "Official tees and merch from Astralnaut Studios." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: ShopPage,
  pendingComponent: () => (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
});

function ShopPage() {
  const { data: products } = useSuspenseQuery(productsQuery);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-[var(--border-line)] bg-gradient-to-b from-black/40 to-transparent">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: "var(--gold)" }}>
              Astralnaut Studios · Merch
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">Shop the drop</h1>
            <p className="mt-4 max-w-xl text-[var(--ink2)]">
              Wear the story. Officially licensed tees from <em>Children of Aquarius</em> and the
              Release the X-Files line. Fulfilled and shipped via our Shopify and TikTok stores.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href={TIKTOK_SHOP_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> TikTok Shop
              </Button>
            </a>
            <CartDrawer />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        {products.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-line)] py-24 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-[var(--mute)]" />
            <p className="mt-4 text-[var(--ink2)]">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.node.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <div className="mx-auto max-w-7xl px-6 pb-8">
        <RightsNotice variant="shop" />
      </div>

      <SiteFooter />
    </div>
  );
}

function ProductCard({ product }: { product: ShopifyProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const variant = product.node.variants.edges[0]?.node;
  const image = product.node.images.edges[0]?.node;
  const price = product.node.priceRange.minVariantPrice;

  const handleAdd = async () => {
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-line)] bg-[color-mix(in_oklab,var(--bg2)_70%,transparent)] transition-all hover:border-[var(--neon)]/40">
      <Link
        to="/product/$handle"
        params={{ handle: product.node.handle }}
        className="relative block aspect-square overflow-hidden bg-black"
      >
        {image ? (
          <img
            src={image.url}
            alt={image.altText ?? product.node.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--mute)]">No image</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link to="/product/$handle" params={{ handle: product.node.handle }}>
          <h3 className="text-lg font-bold leading-tight hover:text-[var(--neon)]">
            {product.node.title}
          </h3>
        </Link>
        <p className="text-sm text-[var(--mute)]">
          From {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
        </p>
        <div className="mt-auto flex gap-2">
          <Button onClick={handleAdd} disabled={isLoading || !variant} className="flex-1">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to cart"}
          </Button>
          <Link to="/product/$handle" params={{ handle: product.node.handle }}>
            <Button variant="outline">Details</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
