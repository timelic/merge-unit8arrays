export function mergeUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * @param concatWhenPushing: true: 使用 buffer 模式，false: 使用 stream 模式
 * @returns
 * @description：默认使用 stream 模式，stream 模式在读取数据时，不需要额外的内存空间，但是在 push 数据时，需要额外的内存空间。而 buffer 模式则相反。
 **/
export const genUnit8ArraysMerger = <T extends boolean = true>(
  concatWhenPushing?: T
): T extends true ? StreamUnit8ArrayMerger : BufferUnit8ArrayMerger => {
  concatWhenPushing = concatWhenPushing ?? (true as any);
  return (
    concatWhenPushing
      ? new StreamUnit8ArrayMerger()
      : new BufferUnit8ArrayMerger()
  ) as any;
};

/**
 * @method push: 将 Uint8Array 添加到合并器中
 * @method readBytes: 从合并器中读取数据
 */
class BufferUnit8ArrayMerger {
  list: Uint8Array[] = [];
  byteOffset = 0;
  length = 0;
  push(unit8Arr: Uint8Array) {
    this.list.push(unit8Arr);
    this.length += unit8Arr.length;
  }
  readBytes(len: number = this.length): Uint8Array | null {
    if (len > 0) {
      let readBuf = new Uint8Array(len);
      let readBuf_index = 0;
      while (readBuf_index < len) {
        if (this.list.length > 0) {
          const tmpbuf = this.list.shift()!;
          const tmplen = tmpbuf.length;
          const last_len = len - readBuf_index;
          if (tmplen >= last_len) {
            //足夠了
            const tmpbuf2 = tmpbuf.subarray(0, last_len);
            readBuf.set(tmpbuf2, readBuf_index);
            readBuf_index += tmpbuf2.length;
            if (last_len < tmplen) {
              const newUint8Array = tmpbuf.subarray(last_len, tmplen);
              this.list.unshift(newUint8Array);
            }
            break;
          } else {
            readBuf.set(tmpbuf, readBuf_index);
            readBuf_index += tmplen;
          }
        } else {
          readBuf = readBuf.subarray(0, readBuf_index);
          break;
        }
      }
      this.length -= readBuf.length;
      return readBuf;
    }
    return null;
  }
}

/**
 * @method push: 将 Uint8Array 添加到合并器中
 * @method readBytes: 从合并器中读取数据
 */
class StreamUnit8ArrayMerger {
  list: ArrayBuffer = new ArrayBuffer(0);
  byteOffset = 0;
  length = 0;
  push(unit8Arr: Uint8Array) {
    const tmpList = new Uint8Array(this.list.byteLength + unit8Arr.byteLength);
    tmpList.set(new Uint8Array(this.list), 0);
    tmpList.set(unit8Arr, this.list.byteLength);
    this.list = tmpList.buffer;
    this.length += unit8Arr.length;
  }
  readBytes(len: number = this.length): Uint8Array | null {
    if (len > 0) {
      const readBuf = new Uint8Array(
        this.list.slice(this.byteOffset, this.byteOffset + len)
      );
      this.byteOffset += readBuf.byteLength;
      this.length -= readBuf.byteLength;
      return readBuf;
    }
    return null;
  }
}
