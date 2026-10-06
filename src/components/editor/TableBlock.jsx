import React from 'react';

// content: { rows: string[][] }
const TableBlock = ({ content, onChange }) => {
  const rows = content?.rows?.length ? content.rows : [['', '']];

  const setCell = (r, c, value) => {
    const next = rows.map((row) => [...row]);
    next[r][c] = value;
    onChange({ rows: next });
  };

  const addRow = () => onChange({ rows: [...rows, rows[0].map(() => '')] });
  const addColumn = () => onChange({ rows: rows.map((row) => [...row, '']) });

  return (
    <div className="w-full">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="border border-light-border p-0 dark:border-dark-border">
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setCell(r, c, e.currentTarget.textContent)}
                    className="min-w-[80px] px-2 py-1.5 outline-none focus:bg-brand-soft"
                  >
                    {cell}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-1 flex gap-3 text-xs text-light-muted dark:text-dark-muted">
        <button onClick={addRow} className="hover:text-brand-500">+ Row</button>
        <button onClick={addColumn} className="hover:text-brand-500">+ Column</button>
      </div>
    </div>
  );
};

export default TableBlock;
