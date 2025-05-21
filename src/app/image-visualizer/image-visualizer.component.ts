import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ImageService } from '../Services/image.service';
import { ImageMagnifierComponent } from '../image-magnifier/image-magnifier.component';
import { FormsModule } from '@angular/forms';
import { Observable, firstValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LucideAngularModule, Search } from 'lucide-angular';
import { HttpResponse } from '@angular/common/http';

interface ImageMetadata {
  name: string;
  width: number;
  height: number;
  format: string;
  size: number;
  colorSpace?: string;
  exif?: Record<string, any>;
  [key: string]: any;
}

interface AnalysisResult {
  overallAssessment: string;
  summary: string;
  manipulationProbability: number;
  cloneDetection: string;
  exifAnalysis: string;
  indicatorsFound: number;
}

interface AnalyzeResponse {
  manipulation_probability: number;
  analysis_text: string;
  exif_data: Record<string, any>;
  clone_count: number;
  original_image: string;
  ela_image: string;
  noise_image: string;
  heatmap_image: string;
  clone_image: string;
}

interface CloneResponse {
  detection: string;
  imageUrl: string;
}

interface ELAResponse {
  imageUrl: string;
}

interface NoiseResponse {
  imageUrl: string;
}

interface MetadataResponse {
  width: number;
  height: number;
  colorSpace: string;
  exif: Record<string, any>;
  analysis: string;
}

interface ManipulateResponse {
  assessment: string;
  summary: string;
  probability: number;
}

@Component({
  selector: 'app-image-visualizer',
  standalone: true,
  imports: [CommonModule, ImageMagnifierComponent, FormsModule, LucideAngularModule],
  templateUrl: './image-visualizer.component.html',
  styleUrls: ['./image-visualizer.component.scss', './image-visualizer1.scss']
})
export class ImageVisualizerComponent implements OnInit {
  originalImage: string | null = null;
  processedImage: string | null = null;
  isLoading = false;
  metadata: ImageMetadata | null = null;
  showMetadata = false;
  zoomLevel = 2.5;
  activeTab: string = 'original';
  
  analysisResult: AnalysisResult = {
    overallAssessment: '',
    summary: '',
    manipulationProbability: 0,
    cloneDetection: '',
    exifAnalysis: '',
    indicatorsFound: 0
  };
  
  elaImage: string | null = null;
  noiseImage: string | null = null;
  cloneImage: string | null = null;
  aiHeatmapImage: string | null = null;
  currentFile: File | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(private imageService: ImageService, private router: Router) { }

  ngOnInit(): void {
    if (!localStorage.getItem('user')) {
      this.router.navigate(['/login']);
    }
  }

  signOut(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/']);
    console.log('Signing out...');
   
  }

  private isValidBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  }

  private ensureBase64Prefix(base64String: string): string {
    if (!base64String) return '';
    
    // If it's already a data URL, return as is
    if (base64String.startsWith('data:')) {
      return base64String;
    }
    
    // If it's a pure base64 string, add the prefix
    if (this.isValidBase64(base64String)) {
      return `data:image/jpeg;base64,${base64String}`;
    }
    
    return base64String;
  }

  handleFileUpload(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Please upload an image file', 'error');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showToast('File size should be less than 10MB', 'error');
      return;
    }

    this.activeTab = 'original';
    this.isLoading = true;
    this.currentFile = file;
    const reader = new FileReader();
    
    reader.onload = () => {
      const base64String = reader.result as string;
      this.originalImage = this.ensureBase64Prefix(base64String);
      this.fetchMetadata(file);
      this.isLoading = false;
    };

    reader.onerror = () => {
      this.showToast('Error reading file', 'error');
      this.isLoading = false;
    };
    
    reader.readAsDataURL(file);
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleFileUpload({ target: { files: event.dataTransfer.files } });
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  async analyzeImage(): Promise<void> {
    if (!this.originalImage || !this.currentFile) {
      this.showToast('Please upload an image first', 'error');
      return;
    }

    this.isLoading = true;

    try {
      // Use the existing imageService with the proper method signature
      const response = await firstValueFrom(
        this.imageService.analyzeImage(this.currentFile).pipe(
          map(res => res.body as AnalyzeResponse)
        )
      );
      
      this.analysisResult.manipulationProbability = response.manipulation_probability || 0;
      this.analysisResult.summary = response.analysis_text || '';
      this.analysisResult.indicatorsFound = response.clone_count || 0;
      
      if (response.manipulation_probability < 0.3) {
        this.analysisResult.overallAssessment = 'Low Risk';
      } else if (response.manipulation_probability < 0.6) {
        this.analysisResult.overallAssessment = 'Medium Risk';
      } else {
        this.analysisResult.overallAssessment = 'High Risk';
      }

      if (response.clone_count > 0) {
        this.analysisResult.cloneDetection = 'Clone artifacts detected';
      } else {
        this.analysisResult.cloneDetection = 'No clone artifacts detected';
      }

      this.analysisResult.exifAnalysis = 'EXIF data appears consistent';
      
      // Update the visualizations
      this.elaImage = this.ensureBase64Prefix(response.ela_image || '');
      this.noiseImage = this.ensureBase64Prefix(response.noise_image || '');
      this.cloneImage = this.ensureBase64Prefix(response.clone_image || '');
      this.aiHeatmapImage = this.ensureBase64Prefix(response.heatmap_image || '');

      setTimeout(() => {
        this.isLoading = false;
      }, 500);
      
    } catch (error) {
      console.error('Analysis error:', error);
      this.showToast('Error analyzing image', 'error');
      this.isLoading = false;
    }
  }

  fetchMetadata(file: File): void {
    this.imageService.metadata(file).pipe(
      map(res => res.body as MetadataResponse),
      catchError(error => {
        console.error('Metadata extraction error:', error);
        throw error;
      })
    ).subscribe({
      next: (response: MetadataResponse) => {
        this.metadata = {
          name: file.name,
          width: response.width || 0,
          height: response.height || 0,
          format: file.type.split('/')[1],
          size: file.size,
          colorSpace: response.colorSpace || '',
          exif: response.exif || {}
        };
        console.log('Metadata:', this.metadata);
      },
      error: (error: any) => {
        console.error('Metadata extraction error:', error);
      }
    });
  }

  increaseZoom(): void {
    if (this.zoomLevel < 10) this.zoomLevel += 0.5;
  }

  decreaseZoom(): void {
    if (this.zoomLevel > 1) this.zoomLevel -= 0.5;
  }

  shouldShowZoomControls(): boolean {
    return this.activeTab === 'original' ||
           (this.activeTab === 'ela' && !!this.elaImage) ||
           (this.activeTab === 'noise' && !!this.noiseImage) ||
           (this.activeTab === 'clone' && !!this.cloneImage) ||
           (this.activeTab === 'ai' && !!this.aiHeatmapImage);
  }

  private showToast(message: string, type: 'success' | 'error' | 'info'): void {
    console.log(`${type}: ${message}`);
    // Implement your toast notification here
  }
}
