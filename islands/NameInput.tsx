import { JSX } from "preact";
import { useLocalStorage } from "@/client/utils/storage.ts";

export default function NameInput(props: JSX.IntrinsicElements["input"]) {
  const [name, setName] = useLocalStorage("name", props.defaultValue ?? "");

  return (
    <input
      type="text"
      {...props}
      value={name}
      onInput={(e) => {
        setName(e.currentTarget.value);
      }}
      onFocus={(e) => {
        if (e.currentTarget.value === props.defaultValue) {
          e.currentTarget.select();
        }
      }}
    />
  );
}
