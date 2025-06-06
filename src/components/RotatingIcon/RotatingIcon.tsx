import React from 'react';
import css from './RotatingIcon.module.css';

export interface IRotatingIconProps {
  direction: DirectionPair;
  isOpen: boolean;
  type?: IconType;
  className?: string;
}

export type IconType = 'chevron' | 'caret' | 'arrow' | 'triangle' | 'plus-minus';
export type Direction = 'top' | 'bottom' | 'left' | 'right';
export type DirectionPair = `${Direction}-${Direction}`;

const RotatingIcon: React.FC<IRotatingIconProps> = (props:IRotatingIconProps) => {
    const {direction,isOpen,type,className} = props;

    const directionAngleMap = React.useMemo<Record<Direction, number>>(()=> {
        return { bottom: 0, left: 90, top: 180, right: 270}
    },[]);

    const getRotationAngle = React.useCallback((direction: DirectionPair, isOpen: boolean) => {
        const [from, to] = direction.split('-') as [Direction, Direction];
        const fromAngle = directionAngleMap[from];
        const toAngle = directionAngleMap[to];
        let delta = (toAngle - fromAngle + 540) % 360 - 180;
        return isOpen ? fromAngle + delta : fromAngle;
    },[directionAngleMap])

    const style = React.useMemo(() => {
        const rotation = getRotationAngle(direction, isOpen);
        return { transform: `rotate(${rotation}deg)` }
    },[isOpen,direction,getRotationAngle]);

  return (
    <span className={`${css.iconWrapper} ${className}`}>
      {type === 'chevron' && (
        <svg className={css.icon} style={style} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>
        </svg>
      )}
      {type === 'caret' && (
        <svg className={css.icon} style={style} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 10l5 5 5-5z"></path>
        </svg>
      )}
      {type === 'arrow' && (
        <svg className={css.icon} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="4" x2="12" y2="14" />
          <polyline points="6 9 12 15 18 9" />
      </svg>
      )}
      {type === 'triangle' && (
        <svg className={css.icon} style={style} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 16l-6-8h12l-6 8z" fill="currentColor" />
        </svg>
      )}
      {type === 'plus-minus' && (
        <svg className={css.icon} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
          {!isOpen && <line x1="12" y1="5" x2="12" y2="19" />}
        </svg>
      )}
    </span>
  );
};

export default RotatingIcon;