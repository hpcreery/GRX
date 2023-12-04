export type ptr<T> = { value: T; }

export function ptr<T>(read: () => T, write: (v: T) => void): ptr<T> {
  return { get value(): T { return read(); }, set value(v) { write(v); } };
}

export function malloc<T>(value: T): ptr<T> {
  let i: T = value;
  return ptr(function () { return i; }, function (v) { i = v; });
}