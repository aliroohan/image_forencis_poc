import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private baseUrl = 'http://159.65.248.129:8000/api';

  constructor(private http: HttpClient) { }

  analyzeImage(image: File) {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.baseUrl}/analyze_image`, formData);
  }

  detectClone(image: File) {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.baseUrl}/detect_clone`, formData);
  }

  ELA(image: File) {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.baseUrl}/error_level_analysis`, formData);
  }

  noise(image: File) {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.baseUrl}/noise_analysis`, formData);
  }

  metadata(image: File) {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.baseUrl}/extract_exif_metadata`, formData);
  }

  manipulate(image: File) {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.baseUrl}/manipulation_likelihood`, formData);
  }


  
  
}
