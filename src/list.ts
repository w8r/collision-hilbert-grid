export class ListNode<T> {
  constructor(
    public data: T,
    public prev?: ListNode<T>,
    public next?: ListNode<T>
  ) {}

  toString() {
    return this.data;
  }
}

export type NodeIndexedCallback<T> = (node: ListNode<T>, index: number) => void;

export class List<T> {
  public head?: ListNode<T>;
  public tail?: ListNode<T>;
  // public byId: Lookup<ListNode<T>> = {};
  // public byIndex: Lookup<ListNode<T>> = {};
  public length = 0;

  append(data: T) {
    let node: ListNode<T>;
    if (!this.head) {
      node = new ListNode(data);
      this.tail = this.head = node;
    } else {
      node = new ListNode(data, this.tail);
      this.tail = this.tail!.next = node;
    }
    this.length++;
    // this.byId[id] = node;
    // this.byIndex[this.length++] = node;
    return node;
  }

  find(data: T) {
    let current = this.head as ListNode<T>;

    do {
      if (current.data === data) return current;
      current = current.next as ListNode<T>;
    } while (current);
    return null;
  }

  forEach(callback: NodeIndexedCallback<T>) {
    let current = this.head as ListNode<T>;
    let index = 0;

    do {
      callback(current, index);
      index++;
    } while ((current = current.next as ListNode<T>));
  }
}
