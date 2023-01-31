import { Layout } from "@/components/Layout.tsx";
import Markdown from "@/islands/Markdown.tsx";

const markdown = `
<t:1674804180>
<t:1674804180:t>
<t:1674804180:T>
<t:1674804180:d>
<t:1674804180:D>
<t:1674804180:f>
<t:1674804180:F>
<t:1674804180:R>

||abcabcabc abcabcabcabcabcab cabcabc abcabcabcabcabcabcab cabcabcabcabcabcabcabcabcabcabcabcabcabc abcabcabcabca bcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabc||

Italics *italics* or _italics_
Underline italics __*underline italics*__
Bold **bold**
Underline bold __**underline bold**__
Bold Italics ***bold italics***
underline bold italics __***underline bold italics***__
Underline __underline__
Strikethrough ~~Strikethrough~~
code: \`hi\`
me: < @398819015088275466>
chan: < #822448431914156063> 
emoji: <:obama:807552820134936586> 
everyone: @everyone 
here: @here
https://google.com
[google](https://google.com)

> hi
> hello

\`\`\`js
console.log("hi")
\`\`\`

😀 😃 😄 😁 😆 😅 😂 🤣 
`;

export default function () {
  return (
    <Layout title="help">
      <article>
        <Markdown extended source={markdown} />
      </article>
    </Layout>
  );
}
