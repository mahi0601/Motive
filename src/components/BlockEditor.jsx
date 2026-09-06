import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Block from './Block';
import SlashMenu from './SlashMenu';
import {
  getBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
} from '../services/blockService';

const BlockEditor = ({ pageId }) => {
  const [blocks, setBlocks] = useState([]);
  const [focusId, setFocusId] = useState(null);
  const [slash, setSlash] = useState(null); // { blockId, position, query }
  const saveTimers = useRef({});

  // Load blocks for the page; seed an empty paragraph if none exist.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await getBlocks(pageId);
      if (!mounted) return;
      if (data.length === 0) {
        const { data: first } = await createBlock(pageId, { type: 'paragraph', content: { text: '' } });
        setBlocks([first]);
        setFocusId(first.id);
      } else {
        setBlocks(data);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pageId]);

  // Toggle blocks have children, one level deep, each with its OWN position
  // sequence scoped to parentBlockId — a child's position never collides
  // with or gets renumbered alongside its parent's top-level siblings.
  const topLevel = blocks.filter((b) => !b.parentBlockId).sort((a, b) => a.position - b.position);
  const childrenOf = (id) => blocks.filter((b) => b.parentBlockId === id).sort((a, b) => a.position - b.position);

  const scheduleSave = useCallback((id, patch) => {
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => {
      updateBlock(id, patch).catch((e) => console.error('save block failed', e));
    }, 500);
  }, []);

  const handleChange = (id, content) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
    scheduleSave(id, { content });

    // keep slash menu query in sync
    if (slash && slash.blockId === id) {
      const text = content.text || '';
      if (!text.startsWith('/')) setSlash(null);
      else setSlash((s) => ({ ...s, query: text.slice(1) }));
    }
  };

  // Renumbers just one sibling group (either the top-level list, or one
  // toggle's children) — never touches positions outside that scope.
  const persistOrderFor = (parentBlockId, list) => {
    reorderBlocks(
      pageId,
      list.map((b, i) => ({ id: b.id, position: i }))
    ).catch(() => {});
    void parentBlockId; // scope is implicit in `list`; kept for readability at call sites
  };

  // Insert a new sibling right after `after` (same parentBlockId), then
  // renumber that sibling group.
  const handleEnter = async (afterId) => {
    const after = blocks.find((b) => b.id === afterId);
    if (!after) return;
    const siblings = after.parentBlockId ? childrenOf(after.parentBlockId) : topLevel;
    const afterIndex = siblings.findIndex((b) => b.id === afterId);

    const { data: created } = await createBlock(pageId, {
      type: 'paragraph',
      content: { text: '' },
      parentBlockId: after.parentBlockId || null,
      position: afterIndex + 1,
    });
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === afterId);
      const next = [...prev];
      next.splice(idx + 1, 0, created);
      return next;
    });
    setFocusId(created.id);
    persistOrderFor(after.parentBlockId, [...siblings.slice(0, afterIndex + 1), created, ...siblings.slice(afterIndex + 1)]);
  };

  const handleDeleteEmpty = async (id) => {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    const siblings = block.parentBlockId ? childrenOf(block.parentBlockId) : topLevel;
    if (!block.parentBlockId && siblings.length === 1) return; // keep at least one top-level block
    const idx = siblings.findIndex((b) => b.id === id);

    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (idx > 0) setFocusId(siblings[idx - 1].id);
    else if (block.parentBlockId) setFocusId(block.parentBlockId); // last child — focus the toggle itself
    await deleteBlock(id).catch((e) => console.error(e));
  };

  // Table/embed carry a different content shape than the plain-text blocks —
  // resetting to { text: '' } on convert would leave them with the wrong shape.
  const defaultContentFor = (type) => {
    if (type === 'table') return { rows: [['', ''], ['', '']] };
    if (type === 'embed') return { url: '' };
    return { text: '' };
  };

  const handleConvert = (id, type) => {
    const content = defaultContentFor(type);
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, type, content } : b)));
    updateBlock(id, { type, content }).catch((e) => console.error(e));
    setFocusId(id);
  };

  const handleToggleCheck = (id, checked) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, checked } } : b))
    );
    updateBlock(id, { content: { ...blocks.find((b) => b.id === id)?.content, checked } }).catch(
      (e) => console.error(e)
    );
  };

  const handleToggleCollapse = (id) => {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    const collapsed = !block.content?.collapsed;
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, collapsed } } : b)));
    updateBlock(id, { content: { ...block.content, collapsed } }).catch((e) => console.error(e));
  };

  // Tab: indent under the immediately preceding top-level sibling, but only
  // if it's a toggle (children only nest one level deep; scope stays tight
  // to "make toggle actually toggle" rather than a general outline system).
  const handleIndent = (id) => {
    const idx = topLevel.findIndex((b) => b.id === id);
    if (idx <= 0) return;
    const prevSibling = topLevel[idx - 1];
    if (prevSibling.type !== 'toggle') return;

    const kids = childrenOf(prevSibling.id);
    const position = kids.length;
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, parentBlockId: prevSibling.id, position } : b)));
    updateBlock(id, { parentBlockId: prevSibling.id, position }).catch((e) => console.error(e));
    // Expand the toggle so the just-indented block is actually visible.
    if (prevSibling.content?.collapsed) handleToggleCollapse(prevSibling.id);
  };

  // Shift+Tab: back to top level, placed right after its (former) parent toggle.
  const handleOutdent = (id) => {
    const block = blocks.find((b) => b.id === id);
    if (!block?.parentBlockId) return;
    const parentIdx = topLevel.findIndex((b) => b.id === block.parentBlockId);
    const position = parentIdx + 1;
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, parentBlockId: null, position } : b)));
    updateBlock(id, { parentBlockId: null, position }).catch((e) => console.error(e));
    persistOrderFor(null, [...topLevel.slice(0, position), block, ...topLevel.slice(position)]);
  };

  const handleSlash = (blockId, position) => setSlash({ blockId, position, query: '' });

  const selectSlashType = (type) => {
    if (!slash) return;
    handleConvert(slash.blockId, type);
    setSlash(null);
  };

  const handleAddBelow = async (id) => {
    await handleEnter(id);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(topLevel);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setBlocks((prev) => {
      const childBlocks = prev.filter((b) => b.parentBlockId);
      return [...reordered, ...childBlocks];
    });
    persistOrderFor(null, reordered);
  };

  const renderBlock = (block, index) => (
    <Block
      key={block.id}
      block={block}
      index={index}
      shouldFocus={focusId === block.id}
      onChange={handleChange}
      onEnter={handleEnter}
      onDeleteEmpty={handleDeleteEmpty}
      onConvert={handleConvert}
      onSlash={handleSlash}
      onToggleCheck={handleToggleCheck}
      onAddBelow={handleAddBelow}
      onToggleCollapse={handleToggleCollapse}
      onIndent={handleIndent}
      onOutdent={handleOutdent}
      childBlocks={block.type === 'toggle' ? childrenOf(block.id) : null}
      renderChild={renderBlock}
    />
  );

  return (
    <div className="relative">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {topLevel.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(prov) => (
                    <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                      {renderBlock(block, index)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {slash && (
        <SlashMenu
          query={slash.query}
          position={slash.position}
          onSelect={selectSlashType}
          onClose={() => setSlash(null)}
        />
      )}
    </div>
  );
};

export default BlockEditor;
