import React from 'react';
import css from './RotatingIcon.module.css';

export interface IRotatingIconProps {
  direction: DirectionPair;
  isOpen: boolean;
  type?: IconType;
  className?: string;
}

export type IconType = 'chevron' | 'caret';
export type Direction = 'top' | 'bottom' | 'left' | 'right';
export type DirectionPair = `${Direction}-${Direction}`;

const RotatingIcon: React.FC<IRotatingIconProps> = (props:IRotatingIconProps) => {
    const {direction,isOpen,type,className} = props;

    const directionAngleMap = React.useMemo<Record<Direction, number>>(()=> {
        return { right: 0, bottom: 90, left: 180, top: 270}
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
    <span className={css.arrowWrapper}>
      <span
        className={`${css.arrow} ${css[type ?? 'chevron']} ${className}`} style={style}/>
    </span>
  );
};

export default RotatingIcon;