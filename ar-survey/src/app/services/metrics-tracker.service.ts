import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { interval, Subscription, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';

export interface InteractionEvent {
 timestamp: number;
 type: string;
 elementId?: string;
 elementTag?: string;
 elementClasses?: string;
 value?: any;
}

export interface DeviceOrientation {
 timestamp: number;
 alpha: number | null;
 beta: number | null;
 gamma: number | null;
}

export interface ArTrackingData {
 timestamp: number;
 modelIsVisible: boolean | null;
 modelWorldPosition: { x: number; y: number; z: number } | null;
 modelInitialScale: { x: number; y: number; z: number } | null;
 cameraFov: number | null;
 cameraAspect: number | null;
 viewerPosition?: { x: number; y: number; z: number; w: number } | null;
 viewerOrientation?: { x: number; y: number; z: number; w: number } | null;
}

export interface DeviceInformation {
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  userAgent: string;
}

export interface MetricsLog {
 testName: string;
 interactions: InteractionEvent[];
 deviceOrientations: DeviceOrientation[];
 arTrackingData: ArTrackingData[];
}

@Injectable({
 providedIn: 'root'
})
export class MetricsTrackerService {
 private http = inject(HttpClient);
 private serverUrl = '/api/log';
 private deviceId: string;

 private allTestLogs: MetricsLog[] = [];
  private deviceInfo: DeviceInformation | null = null;
  private activeLog: MetricsLog | null = null;

 private modelViewerElement: any = null;
 private trackingSubscription: Subscription | null = null;
 private lastDeviceOrientation: DeviceOrientationEvent | null = null;

 constructor() {
  this.handleDeviceOrientation = this.handleDeviceOrientation.bind(this);

  const storedId = localStorage.getItem('device-uuid');
  this.deviceId = storedId || uuidv4();
  if (!storedId) {
   localStorage.setItem('device-uuid', this.deviceId);
  }

  if (typeof window !== 'undefined') {
   window.addEventListener('deviceorientation', this.handleDeviceOrientation, true);
  }
 }

 private handleDeviceOrientation(event: DeviceOrientationEvent): void {
  this.lastDeviceOrientation = event;
 }

 public logInteraction(event: Event): void {
    if (!this.activeLog) return; // Don't log if no test is active

  const target = event.target as HTMLElement;
  let interaction: InteractionEvent;

  if (target) {
   interaction = { timestamp: Date.now(), type: event.type, elementId: target.id, elementTag: target.tagName, elementClasses: target.className, value: (target as any).value ?? undefined };
  } else if (event instanceof CustomEvent) {
   interaction = { timestamp: Date.now(), type: event.type, value: event.detail };
  } else {
   console.warn("logInteraction called with an unknown event type:", event);
   return;
  }
  this.activeLog.interactions.push(interaction);
 }
 
  private getInternalThreeObjects(modelViewerElement: any): { scene: any; renderer: any } {
    let scene = null;
    let renderer = null;

    for (let p = modelViewerElement; p != null; p = Object.getPrototypeOf(p)) {
      const privateAPI = Object.getOwnPropertySymbols(p);
      const rendererSym = privateAPI.find((s) => s.toString() === 'Symbol(renderer)');
      const sceneSym = privateAPI.find((s) => s.toString() === 'Symbol(scene)');
      
      if (rendererSym && modelViewerElement[rendererSym]) {
        renderer = modelViewerElement[rendererSym].threeRenderer;
      }
      if (sceneSym && modelViewerElement[sceneSym]) {
        scene = modelViewerElement[sceneSym];
      }
      if (renderer && scene) {
        break;
      }
    }
    return { scene, renderer };
  }

 public startTracking(modelViewerElement: any, testName: string): void {
  this.stopTracking();

  if (!modelViewerElement) {
   console.error("startTracking called with no modelViewerElement.");
   return;
  }
  this.modelViewerElement = modelViewerElement;
    
    const newLog: MetricsLog = {
      testName,
      interactions: [],
      deviceOrientations: [],
      arTrackingData: []
    };
    this.allTestLogs.push(newLog);
    this.activeLog = newLog;

    if (!this.deviceInfo) {
      this.deviceInfo = {
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
        userAgent: navigator.userAgent
      };
    }
    
    const { scene, renderer } = this.getInternalThreeObjects(this.modelViewerElement);
    
    if (!scene || !renderer) {
      console.error("Could not access internal Three.js scene or renderer. Tracking cannot start.");
      return;
    }

  console.log(`Starting tracking for test: ${testName}`);
  this.trackingSubscription = interval(100).subscribe(async () => {
      if (!this.activeLog) return;

   const timestamp = Date.now();
      const model = scene?._model;
      const camera = scene?.camera;
      const session = renderer?.xr?.getSession();

      let modelWorldPosition = null;
      if (model) {
        model.updateWorldMatrix(true, false);
        modelWorldPosition = new THREE.Vector3();
        modelWorldPosition.setFromMatrixPosition(model.matrixWorld);
      }

   const arData: ArTrackingData = {
        timestamp,
        modelIsVisible: model ? model.visible : null,
        modelWorldPosition: modelWorldPosition ? { ...modelWorldPosition } : null,
        modelInitialScale: model ? { ...model.scale } : null,
        cameraFov: camera ? camera.fov : null,
        cameraAspect: camera ? camera.aspect : null
      };

   if (session) {
     const frame = await new Promise<any>(resolve => session.requestAnimationFrame((time: any, frame: any) => resolve(frame)));
     const referenceSpace = renderer.xr.getReferenceSpace();
     if (frame && referenceSpace) {
       const viewerPose = frame.getViewerPose(referenceSpace);
       if (viewerPose) {
         const { transform } = viewerPose;
                  arData.viewerPosition = { x: transform.position.x, y: transform.position.y, z: transform.position.z, w: transform.position.w };
                  arData.viewerOrientation = { x: transform.orientation.x, y: transform.orientation.y, z: transform.orientation.z, w: transform.orientation.w };
       }
     }
   }
   
   this.activeLog.arTrackingData.push(arData);

   if (this.lastDeviceOrientation) {
    const orientationData: DeviceOrientation = { timestamp, alpha: this.lastDeviceOrientation.alpha, beta: this.lastDeviceOrientation.beta, gamma: this.lastDeviceOrientation.gamma };
    this.activeLog.deviceOrientations.push(orientationData);
   }
  });
 }

 public stopTracking(): void {
  if (this.trackingSubscription) {
   this.trackingSubscription.unsubscribe();
   this.trackingSubscription = null;
  }
  this.modelViewerElement = null;
    this.activeLog = null;
 }

 public sendMetricsToServer(formData?: any) {
  const payload = { 
      deviceId: this.deviceId,
      deviceInfo: this.deviceInfo,
      testLogs: this.allTestLogs, // Send the entire collection of logs
      ...(formData && { formData })
    };
  
  this.stopTracking();
  return this.http.post(this.serverUrl, payload).pipe(
   tap({
    next: () => {
          console.log(`Metrics for session sent successfully.`);
          this.resetAllMetrics();
        },
    error: (err) => console.error(`Failed to send metrics:`, err)
   })
  );
 }

 public resetAllMetrics(): void {
  this.allTestLogs = [];
    this.deviceInfo = null;
    this.activeLog = null;
 }
}
