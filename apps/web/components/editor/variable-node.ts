import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variable: {
      /** Insert a variable token node at the current cursor position. */
      insertVariable: (key: string) => ReturnType;
    };
  }
}

export const VariableNode = Node.create({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      key: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-variable'),
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-variable': attributes['key'],
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-variable]' }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    const key = HTMLAttributes['data-variable'] as string;
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'variable-token',
        contenteditable: 'false',
      }),
      `{{${key}}}`,
    ];
  },

  addCommands() {
    return {
      insertVariable:
        (key: string) =>
        ({ chain }: { chain: () => { insertContent: (content: unknown) => { run: () => boolean } } }) => {
          return chain()
            .insertContent({ type: this.name, attrs: { key } })
            .run();
        },
    };
  },
});
