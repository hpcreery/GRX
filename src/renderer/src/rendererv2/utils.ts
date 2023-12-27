export type ptr<T extends boolean | number | bigint | string | symbol | null | undefined> = { value: T; }

export function ptr<T extends boolean | number | bigint | string | symbol | null | undefined>(read: () => T, write: (v: T) => void): ptr<T> {
  return { get value(): T { return read(); }, set value(v) { write(v); } };
}

export function malloc<T extends boolean | number | bigint | string | symbol | null | undefined>(value: T): ptr<T> {
  let i: T = value;
  return ptr(function () { return i; }, function (v) { i = v; });
}
