import { ComponentChildren } from "preact";
import { Head } from "$fresh/runtime.ts";

export function Layout(
  { title, children, fullwidth = false }: {
    title: string;
    children: ComponentChildren;
    fullwidth?: boolean;
  },
) {
  return (
    <>
      <Head>
        <title>ventbot | {title}</title>
      </Head>
      <main
        class={`p-4 mx-auto text-neutral-12 max-w-screen-${
          fullwidth ? "full" : "md"
        }`}
      >
        <a href="/">ventbot</a>
        <h1 class="mb-4 text-2xl font-bold md:text-4xl">{title}</h1>
        {children}
      </main>
    </>
  );
}
