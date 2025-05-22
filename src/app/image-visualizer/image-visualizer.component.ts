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
  manipulationProbabilityPercent: string;
  summary: string;
  manipulationProbability: number;
  cloneDetection: string;
  cloneCount: number;
  exifAnalysis: string;
  indicatorsFound: number;
  detailedIndicators: string[];
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
  styleUrls: ['./image-visualizer.component.scss', './image-visualizer1.scss', './image-visualizer2.scss']
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
    manipulationProbabilityPercent: '',
    summary: '',
    manipulationProbability: 0,
    cloneDetection: '',
    cloneCount: 0,
    exifAnalysis: '',
    indicatorsFound: 0,
    detailedIndicators: []
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

    // Clear previous results
    this.clearPreviousResults();

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

  // Helper method to clear all previous analysis results
  private clearPreviousResults(): void {
    // Clear all analysis images
    this.elaImage = null;
    this.noiseImage = null;
    this.cloneImage = null;
    this.aiHeatmapImage = null;
    
    // Reset analysis results
    this.analysisResult = {
      overallAssessment: '',
      manipulationProbabilityPercent: '',
      summary: '',
      manipulationProbability: 0,
      cloneDetection: '',
      cloneCount: 0,
      exifAnalysis: '',
      indicatorsFound: 0,
      detailedIndicators: []
    };
    
    // Reset metadata
    this.metadata = null;
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

  analyzeImage(): Promise<void> {
    if (!this.originalImage || !this.currentFile) {
      this.showToast('Please upload an image first', 'error');
      return Promise.resolve();
    }

    this.isLoading = true;

    try {
      // Use the existing imageService with the proper method signature
      return firstValueFrom(
        this.imageService.analyzeImage(this.currentFile).pipe(
          map(res => res.body as AnalyzeResponse)
        )
      ).then(response => {
        this.analysisResult.manipulationProbability = response.manipulation_probability || 0;
        this.analysisResult.manipulationProbabilityPercent = 
          `${(response.manipulation_probability * 100).toFixed(1)}%`;
        this.analysisResult.summary = response.analysis_text || '';
        this.analysisResult.cloneCount = response.clone_count || 0;
        this.analysisResult.indicatorsFound = response.clone_count || 0;
        
        if (response.manipulation_probability < 0.3) {
          this.analysisResult.overallAssessment = 'Low Risk';
        } else if (response.manipulation_probability < 0.6) {
          this.analysisResult.overallAssessment = 'Medium Risk';
        } else {
          this.analysisResult.overallAssessment = 'High Risk';
        }

        if (response.clone_count > 0) {
          this.analysisResult.cloneDetection = 
            `Found ${response.clone_count} potential cloned regions in the image.`;
          if (response.clone_count > 1000) {
            this.analysisResult.cloneDetection += ' Significant number of copy-paste regions detected.';
          }
        } else {
          this.analysisResult.cloneDetection = 'No clone artifacts detected';
        }

        // Check if EXIF data exists
        const hasExif = response.exif_data && Object.keys(response.exif_data).length > 0;
        this.analysisResult.exifAnalysis = hasExif ? 
          'EXIF metadata appears consistent' : 'No EXIF metadata found';
        
        // Set detailed indicators
        this.analysisResult.detailedIndicators = [];
        if (!hasExif) {
          this.analysisResult.detailedIndicators.push('No EXIF metadata available');
        }
        
        // Add more indicators based on analysis
        if (response.clone_count > 0) {
          this.analysisResult.detailedIndicators.push(`${response.clone_count} potential cloned regions detected`);
        }
        
        // Add additional analysis indicators from the text
        if (this.analysisResult.summary) {
          const lines = this.analysisResult.summary.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            if (line.includes('indicator') || line.includes('detect') || line.includes('found')) {
              this.analysisResult.detailedIndicators.push(line.trim());
            }
          });
        }
        
        // Remove any duplicate indicators
        this.analysisResult.detailedIndicators = [...new Set(this.analysisResult.detailedIndicators)];
        
        // Update the visualizations
        this.elaImage = this.ensureBase64Prefix(response.ela_image || '');
        this.noiseImage = this.ensureBase64Prefix(response.noise_image || '');
        this.cloneImage = this.ensureBase64Prefix(response.clone_image || '');
        this.aiHeatmapImage = this.ensureBase64Prefix(response.heatmap_image || '');

        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      }).catch(error => {
        console.error('Analysis error:', error);
        this.showToast('Error analyzing image', 'error');
        this.isLoading = false;
        return Promise.reject(error);
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      this.showToast('Error analyzing image', 'error');
      this.isLoading = false;
      return Promise.reject(error);
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
