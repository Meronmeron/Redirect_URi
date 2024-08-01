import sys
from moviepy.editor import VideoFileClip, ImageClip, CompositeVideoClip

def process_video(video_path, creative_path, slider_value, horizontal_value, width_value, height_value, start_time, end_time, output_path, animation_duration, animation_type, width, height):
    video = VideoFileClip(video_path).resize(newsize=(width, height))
    creative = (VideoFileClip(creative_path) if creative_path.lower().endswith(('mp4', 'avi', 'mov'))
                else ImageClip(creative_path).set_duration(video.duration))
    animation_duration = int(animation_duration)
    height = int(height)
    height_value = int(height_value)
    width = int(width)
    width_value = int(width_value)
    slider_value = int(slider_value)
    horizontal_value = int(horizontal_value)
    y = slider_value * int(height - height_value) / 100
    x = horizontal_value * int(width - width_value) / 100
    creative = creative.resize(newsize=(width_value, height_value))
    creative = creative.set_start(start_time)
    creative = creative.set_position((x,y))
    if end_time:
        creative = creative.set_end(end_time)    
    if animation_type == 'fadein':
        creative = creative.fadein(animation_duration)
    elif animation_type == 'fadeout':
        creative = creative.fadeout(animation_duration)   
    elif animation_type == 'slide':
        creative = creative.set_position(lambda t: (0 if t < start_time else int((t - start_time) * (width - creative.size[0]) / (end_time - start_time)), y))        

    final = CompositeVideoClip([video, creative])
    final.write_videofile(output_path, codec='libx264')

if __name__ == '__main__':
    args = sys.argv[1:]
    process_video(*args)
