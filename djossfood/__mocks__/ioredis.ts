export const mockIncr = jest.fn();
export const mockPexpire = jest.fn();

export default class Redis {
  incr(...args: any[]) {
    return mockIncr(...args);
  }

  pexpire(...args: any[]) {
    return mockPexpire(...args);
  }

  on(..._args: any[]) {
    return jest.fn();
  }
}
