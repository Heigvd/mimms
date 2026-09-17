interface OverlayProps {
  position: PointLikeObject;
  id?: string;
  className?: string;
  offset?: PointLikeObject;
  positioning?: PositioningOptions;
  stopEvent?: boolean;
  insertFirst?: boolean;
}

interface OverlayItem {
  overlayProps: OverlayProps;
  // TODO refactor to Record<string, any> (in WEGAS too)
  payload: { [id: string]: unknown };
}
