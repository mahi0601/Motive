import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Block from './Block';
import SlashMenu from './SlashMenu';
import { logger } from '../../utils/logger';
import {
  getBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
} from '../../services/blockService';

const BlockEditor = ({ pageId }) => {
  const [blocks, setBlocks] = useState([]);
  const [focusId, setFocusId] = useState(null);
  const [slash, setSlash] = useState(null); // { blockId, position, query }
  const [loadError, setLoadError] = useState(false);
  const saveTimers = useRef({});

  // Load blocks for the page; seed an empty paragraph if none exist.
  useEffect(() => {
    let mounted = true;
    setLoadError(false);
    (async () => {
      try {
        const { data } = await getBlocks(pageId);
        if (!mounted) return;
        if (data.blocks.length === 0) {
          const { data: created } = await createBlock(pageId, { type: 'paragraph', content: { text: '' } });
          if (!mounted) return;
          setBlocks([created.block]);
          setFocusId(created.block.id);
        } else {
          setBlocks(data.blocks);
        }
      } catch (e) {
        // A 403/404 (no access, or the page is gone) must not leave the editor on "Loading…" forever.
        logger.warn('Could not load blocks', { pageId, error: e.message });
        if (mounted) setLoadError(true);
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
      updateBlock(id, patch).catch((e) => logger.warn('Block autosave failed', { blockId: id, error: e.message }));
    }, 500);
  }, []);

  // A structural change (convert, check, collapse) saves the block's whole current content itself,
  // so any typing save still waiting would land AFTER it and overwrite it with stale text.
  const cancelPendingSave = (id) => {
    clearTimeout(saveTimers.current[id]);
    delete saveTimers.current[id];
  };

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
    // The list is sorted by `position`, so the local copies must carry the new order too, or the
    // editor snaps back to the old one while the server already has the new one.
    const order = new Map(list.map((b, i) => [b.id, i]));
    setBlocks((prev) => prev.map((b) => (order.has(b.id) ? { ...b, position: order.get(b.id) } : b)));
    reorderBlocks(
      pageId,
      list.map((b, i) => ({ id: b.id, position: i }))
    ).catch((e) => logger.warn('Block reorder failed', { pageId, error: e.message }));
    void parentBlockId; // scope is implicit in `list`; kept for readability at call sites
  };

  // Insert a new sibling right after `after` (same parentBlockId), then
  // renumber that sibling group.
  const handleEnter = async (afterId) => {
    const after = blocks.find((b) => b.id === afterId);
    if (!after) return;
    const siblings = after.parentBlockId ? childrenOf(after.parentBlockId) : topLevel;
    const afterIndex = siblings.findIndex((b) => b.id === afterId);

    const { data } = await createBlock(pageId, {
      type: 'paragraph',
      content: { text: '' },
      parentBlockId: after.parentBlockId || null,
      position: afterIndex + 1,
    });
    const created = data.block;
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
    await deleteBlock(id).catch((e) => logger.warn('Block delete failed', { blockId: id, error: e.message }));
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
    cancelPendingSave(id);
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, type, content } : b)));
    updateBlock(id, { type, content }).catch((e) => logger.warn('Block type-convert failed', { blockId: id, type, error: e.message }));
    setFocusId(id);
  };

  const handleToggleCheck = (id, checked) => {
    cancelPendingSave(id);
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, checked } } : b))
    );
    updateBlock(id, { content: { ...blocks.find((b) => b.id === id)?.content, checked } }).catch(
      (e) => logger.warn('Checkbox toggle failed', { blockId: id, error: e.message })
    );
  };

  const handleToggleCollapse = (id) => {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    const collapsed = !block.content?.collapsed;
    cancelPendingSave(id);
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, collapsed } } : b)));
    updateBlock(id, { content: { ...block.content, collapsed } }).catch((e) => logger.warn('Toggle collapse-state save failed', { blockId: id, error: e.message }));
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
    updateBlock(id, { parentBlockId: prevSibling.id, position }).catch((e) => logger.warn('Block indent failed', { blockId: id, error: e.message }));
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
    updateBlock(id, { parentBlockId: null, position }).catch((e) => logger.warn('Block outdent failed', { blockId: id, error: e.message }));
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

  if (loadError) {
    return <div role="alert" className="p-4 text-light-muted dark:text-dark-muted">This page could not be loaded. It may have been removed, or you may no longer have access.</div>;
  }

  return (
    <div className="relative">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {/* The library gives the drag handle role="button"; a button that contains the block's own buttons and inputs is invalid for assistive tech, so it is a group. Keyboard dragging keeps working (it depends on tabindex and key events, not the role). */}
              {topLevel.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(prov) => (
                    <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} role="group" aria-roledescription="sortable block">
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
