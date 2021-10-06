import React, { useCallback, useMemo, useState } from 'react';

import { createEditor, Descendant, Editor, Text, Transforms } from 'slate';

import type { BaseEditor } from 'slate';
import type { ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react';

type ElementType = 'paragraph' | 'code' | 'strong';

type CustomText = {
  text: string,
  type?: 'strong',
};

type CustomElement = {
  type: ElementType,
  children: CustomText[]
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor,
    Element: CustomElement,
    Text: CustomText,
  }
}

import { Slate, Editable, withReact } from 'slate-react';

const CodeElement = ({ children, attributes }) => (
  <pre {...attributes}>
    <code>{ children }</code>
  </pre>
);

const Leaf = ({ leaf, attributes, children }: RenderLeafProps) => {
  const leaves = {
    strong: <strong {...attributes}>{ children }</strong>,
  }

  return leaves[leaf.type] || <span {...attributes}>{ children }</span> 
}

const DefaultElement = ({ children, attributes }) => <p {...attributes}>{ children }</p>;

function MyEditor() {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [value, setValue] = useState<Descendant[]>([
    {
      type: 'paragraph',
      children: [{ text: 'This is a paragraph' }]
    },
  ]);

  const renderElement = useCallback((props: RenderElementProps) => {
    const elements = {
      code: <CodeElement {...props} />,
    }

    return elements[props.element.type] || <DefaultElement {...props} />
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return <Leaf {...props} />
  }, []);

  return(
    <Slate
      editor={ editor }
      value={ value }
      onChange={ (newValue) => setValue(newValue) }
    >
      <Editable
        onKeyDown={ (e) => {
          if (!e.ctrlKey) return;
          e.preventDefault();

          const handlers = {
            '`': () => {
              const [match] = Editor.nodes(editor, { match: (n: CustomElement) => n.type ==='code' })

              Transforms.setNodes(
                editor,
                { type: match ? 'paragraph' : 'code' },
                { match: (n) => Editor.isBlock(editor, n) },
              );
            },

            'b': () => {
              Transforms.setNodes(
                editor,
                { type: 'strong' },
                {
                  match: (n) => Text.isText(n),
                  split: true
                },
              )
            }
          }

          handlers[e.key] && handlers[e.key]();
        } }
        renderElement={ renderElement }
        renderLeaf={ renderLeaf }
      />
    </Slate>
  );
}

export default MyEditor;