export type immutable = boolean | number | bigint | string | symbol | null | undefined;

export type ptr<T extends immutable> = { value: T; }

export function ptr<T extends immutable>(read: () => T, write: (v: T) => void): ptr<T> {
  return { get value(): T { return read(); }, set value(v) { write(v); } };
}

export function malloc<T extends immutable>(value: T): ptr<T> {
  let i: T = value;
  return ptr(function () { return i; }, function (v) { i = v; });
}
