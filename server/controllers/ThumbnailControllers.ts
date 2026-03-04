import { Request, Response } from "express";
import Thumbnail from "../models/Thumbnail.js";
import { GenerateContentConfig, HarmCategory, HarmBlockThreshold } from "@google/genai";
import ai from "../configs/ai.js";
import path from "path/win32";
import fs from "fs";
import {v2 as cloudinary} from "cloudinary";


const stylePrompts = {
    'Bold & Graphic': 'High contrast, vibrant colors, and strong typography for maximum impact.',
    'Clean & Minimal': 'Simple layouts, ample white space, and a focus on typography for a modern look.',
    'Illustrative': 'Hand-drawn elements, custom illustrations, and a playful vibe to stand out.',
    'Photo-Centric': 'Large, eye-catching images with minimal text for a visually striking thumbnail.',
    'Text-Heavy': 'Bold typography and layered text effects for thumbnails that rely on messaging.',
} as const;

const colorSchemeDescriptions = {
    vibrant: 'vibrant and energetic colors, high saturation, bold contrasts, eye-catching palette',
    sunset: 'warm sunset tones, orange pink and purple hues, softgradients, cinematic glow',
    forest: 'natural green tones, earthy colors, calm and organic palette, fresh atmosphere',
    neon: 'neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow',
    purple: 'purple-dominant color palette, magenta and violet tones, modern and stylish mood',
    monochrome: 'black and white color scheme, high contrast, dramatic lighting, timeless aesthetic',
    ocean: 'cool blue and teal tones, aquatic color palette, fresh and clean atmosphere',
    pastel: 'soft pastel colors, low saturation, gentle tones and friendly aesthetic',
}

export const generateThumbnail = async (req: Request, res : Response ) => {
    try {
        const {userId} = req.session;
        const {
            title,
            prompt: user_prompt,
            style,
            aspect_ratio,
            color_scheme,
            text_overlay
        } = req.body;
        
        const thumbnail = await Thumbnail.create({
            userId,
            title,
            prompt_used: user_prompt, 
            user_prompt,
            style,
            aspect_ratio,
            color_scheme,
            text_overlay,
            isGenerating: true
        })

        const model = 'gemini-3-pro-image-preview';
        const generationConfig : GenerateContentConfig = {
            maxOutputTokens: 32768,
            temperature: 1,
            topP: 0.95,
            responseModalities: ['IMAGE'],
            imageConfig: {
            aspectRatio: aspect_ratio || '16:9',
            imageSize: '1K'
        },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.OFF},
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.OFF},
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.OFF },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.OFF},
        ]
    }

    let prompt = `Create a ${stylePrompts[style as keyof typeof stylePrompts]} for the following thumbnail title: "${title}".`

    if(color_scheme){
        prompt += ` Use a ${colorSchemeDescriptions[color_scheme as keyof typeof colorSchemeDescriptions]} color scheme.`
    }
    if(user_prompt){
        prompt += ` Also incorporate the following elements as described : ${user_prompt}`
    }

    prompt += ` The thumbnail should be in ${aspect_ratio || '16:9'} aspect ratio, visually striking, and optimized for high click-through rates on YouTube. Make sure the design is unique and not a common template and also make it bold and eye-catching to stand out among other thumbnails impossible to ignore.`

    //generate the image using ai model
    const response : any = await ai.models.generateContent({
        model, 
        contents : [prompt], 
        config :  generationConfig
    }); 

    //check if the response is valid
    if(!response?.candidates?.[0]?.content?.parts){
        throw new Error('Unexpected response')
    }
    const parts = response.candidates[0].content.parts;

    let finalBuffer : Buffer | null = null;

    for(const part of parts){
        if(part.inlineData){
            finalBuffer = Buffer.from(part.inlineData.data, 'base64');
        }
    }

    const filename = `final-output-${Date.now()}.png`;
    const filePath = path.join('images', filename);

    // create the images directory if it doesn't exist
    fs.mkdirSync('images', {recursive: true});

    //save the image to local storage
    fs.writeFileSync(filePath, finalBuffer!);

    const uploadResult = await cloudinary.uploader.upload(filePath, {resource_type: 'image'});

    thumbnail.image_url = uploadResult.url;
    thumbnail.isGenerating = false;
    await thumbnail.save();

    res.json({message: 'Thumbnail generated successfully', thumbnail})

    // remove image file from disk
    fs.unlinkSync(filePath);

    } catch (error : any) {
        console.log(error);
        res.status(500).json({message: 'Server error', error: error.message})
    }
}

// controllers for thumbnail deletion
export const deleteThumbnail = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;
        const {userId} = req.session;

        await Thumbnail.findByIdAndDelete({_id: id, userId});
        res.json({message: 'Thumbnail deleted successfully'})
        
    } catch (error : any) {
        console.log(error);
        res.status(500).json({message: error.message})
    }
}