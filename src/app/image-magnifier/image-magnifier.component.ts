// image-magnifier.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-image-magnifier',
  imports: [CommonModule],
  templateUrl: './image-magnifier.component.html',
  styleUrls: ['./image-magnifier.component.scss']
})
export class ImageMagnifierComponent implements AfterViewInit {
  @Input() src!: string;
  @Input() width: string = '100%';
  @Input() zoomLevel: number = 2.5;
  @Input() allowScrollOnMobile: boolean = false; // Option to allow scrolling while using magnifier
  
  @ViewChild('imgRef') imgRef!: ElementRef;
  
  position = { x: 0, y: 0 };
  showMagnifier = false;
  cursorPosition = { x: 0, y: 0 };
  magnifierSize = 150; // Default size
  isMobile = false;
  isTouching = false;
  
  constructor() {
    // Set magnifier size based on screen width
    this.setResponsiveMagnifierSize();
    // Check if device is mobile
    this.isMobile = window.innerWidth < 768;
  }
  
  ngAfterViewInit() {}

  @HostListener('window:resize')
  onResize() {
    // Update magnifier size on window resize
    this.setResponsiveMagnifierSize();
    this.isMobile = window.innerWidth < 768;
  }
  
  private setResponsiveMagnifierSize() {
    const screenWidth = window.innerWidth;
    if (screenWidth < 768) { // Mobile
      this.magnifierSize = 100;
    } else if (screenWidth < 1024) { // Tablet
      this.magnifierSize = 120;
    } else { // Desktop
      this.magnifierSize = 150;
    }
  }
  
  handleMouseMove(e: MouseEvent) {
    if (this.imgRef && this.imgRef.nativeElement && !this.isTouching) {
      this.updateMagnifier(e.clientX, e.clientY);
    }
  }
  
  handleTouchStart(e: TouchEvent) {
    this.isTouching = true;
    // Only prevent default if we don't want to allow scrolling on mobile
    if (!this.allowScrollOnMobile) {
      e.preventDefault();
    }
    
    if (e.touches.length > 0) {
      this.updateMagnifier(e.touches[0].clientX, e.touches[0].clientY);
    }
  }
  
  handleTouchMove(e: TouchEvent) {
    // Only prevent default if we don't want to allow scrolling on mobile
    if (!this.allowScrollOnMobile) {
      e.preventDefault();
    }
    
    if (e.touches.length > 0) {
      // Use requestAnimationFrame for smoother performance
      requestAnimationFrame(() => {
        this.updateMagnifier(e.touches[0].clientX, e.touches[0].clientY);
      });
    }
  }
  
  handleTouchEnd(e: TouchEvent) {
    this.isTouching = false;
    this.showMagnifier = false;
  }
  
  private updateMagnifier(clientX: number, clientY: number) {
    // Get image position and dimensions
    const rect = this.imgRef.nativeElement.getBoundingClientRect();
    
    // Check if the touch/click is within the image boundaries
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      this.showMagnifier = false;
      return;
    }
    
    // Calculate position relative to the image
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Calculate cursor position as percentage of image dimensions
    this.cursorPosition = {
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    };
    
    // Ensure the magnifier stays within image bounds
    const halfSize = this.magnifierSize / 2;
    
    // Calculate the magnifier position
    const magnifierX = Math.max(halfSize, Math.min(rect.width - halfSize, x));
    const magnifierY = Math.max(halfSize, Math.min(rect.height - halfSize, y));
    
    // Set the magnifier position
    this.position = {
      x: magnifierX,
      y: magnifierY
    };
    
    this.showMagnifier = true;
  }
  
  @HostListener('mouseleave')
  handleMouseLeave() {
    if (!this.isTouching) {
      this.showMagnifier = false;
    }
  }
}
