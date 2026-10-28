import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathFormulaProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

export const MathFormula: React.FC<MathFormulaProps> = ({
  formula,
  displayMode = true,
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode,
        throwOnError: false,
      });
    } catch (err) {
      console.error('KaTeX error:', err);
      return formula;
    }
  }, [formula, displayMode]);

  return (
    <span
      className={`math-formula ${displayMode ? 'display-math' : 'inline-math'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
