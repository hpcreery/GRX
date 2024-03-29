import { Units } from './types';

export type immutable = boolean | number | bigint | string | symbol | null | undefined;

export type ptr<T extends immutable> = { value: T; }

export function ptr<T extends immutable>(read: () => T, write: (v: T) => void): ptr<T> {
  return { get value(): T { return read(); }, set value(v) { write(v); } };
}

export function malloc<T extends immutable>(value: T): ptr<T> {
  let i: T = value;
  return ptr(function () { return i; }, function (v) { i = v; });
}

export function getUnitsConversion(units: Units): number {
  switch (units) {
    case 'mm':
      return 1;
    case 'inch':
      return 1 / 25.4;
    case 'cm':
      return 1 / 10;
    case 'mil':
      return 1000 / 25.4;
    default:
      return units;
  }
}
