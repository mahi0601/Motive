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
        setFocusId(first._id);
      } else {
        setBlocks(data);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pageId]);

  const scheduleSave = useCallback((id, patch) => {
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => {
      updateBlock(id, patch).catch((e) => console.error('save block failed', e));
    }, 500);
  }, []);

  const handleChange = (id, content) => {
    setBlocks((prev) => prev.map((b) => (b._id === id ? { ...b, content } : b)));
    scheduleSave(id, { content });

    // keep slash menu query in sync
    if (slash && slash.blockId === id) {
      const text = content.text || '';
      if (!text.startsWith('/')) setSlash(null);
      else setSlash((s) => ({ ...s, query: text.slice(1) }));
    }
  };

  const handleEnter = async (id, index) => {
    const { data: created } = await createBlock(pageId, {
      type: 'paragraph',
      content: { text: '' },
      position: index + 1,
    });
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, created);
      return next;
    });
    setFocusId(created._id);
    // re-sequence positions on the server
    persistOrder();
  };

  const handleDeleteEmpty = async (id, index) => {
    if (blocks.length === 1) return; // keep at least one block
    setBlocks((prev) => prev.filter((b) => b._id !== id));
    if (index > 0) setFocusId(blocks[index - 1]._id);
    await deleteBlock(id).catch((e) => console.error(e));
  };

  const handleConvert = (id, type) => {
    setBlocks((prev) => prev.map((b) => (b._id === id ? { ...b, type, content: { text: '' } } : b)));
    updateBlock(id, { type, content: { text: '' } }).catch((e) => console.error(e));
    setFocusId(id);
  };

  const handleToggleCheck = (id, checked) => {
    setBlocks((prev) =>
      prev.map((b) => (b._id === id ? { ...b, content: { ...b.content, checked } } : b))
    );
    updateBlock(id, { content: { ...blocks.find((b) => b._id === id)?.content, checked } }).catch(
      (e) => console.error(e)
    );
  };

  const handleSlash = (blockId, position) => setSlash({ blockId, position, query: '' });

  const selectSlashType = (type) => {
    if (!slash) return;
    if (type === 'divider' || type === 'image') {
      // replace current block with the special block
      handleConvert(slash.blockId, type);
    } else {
      handleConvert(slash.blockId, type);
    }
    setSlash(null);
  };

  const handleAddBelow = async (index) => {
    await handleEnter(null, index);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(blocks);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setBlocks(reordered);
    reorderBlocks(
      pageId,
      reordered.map((b, i) => ({ id: b._id, position: i }))
    ).catch((e) => console.error(e));
  };

  const persistOrder = () => {
    setBlocks((cur) => {
      reorderBlocks(
        pageId,
        cur.map((b, i) => ({ id: b._id, position: i }))
      ).catch(() => {});
      return cur;
    });
  };

  return (
    <div className="relative">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {blocks.map((block, index) => (
                <Draggable key={block._id} draggableId={block._id} index={index}>
                  {(prov) => (
                    <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                      <Block
                        block={block}
                        index={index}
                        shouldFocus={focusId === block._id}
                        onChange={handleChange}
                        onEnter={handleEnter}
                        onDeleteEmpty={handleDeleteEmpty}
                        onConvert={handleConvert}
                        onSlash={handleSlash}
                        onToggleCheck={handleToggleCheck}
                        onAddBelow={handleAddBelow}
                      />
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
