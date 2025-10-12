import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PROMPT_TEMPLATES = [
  {
    category: 'Product Photography',
    templates: [
      {
        name: 'Professional Product Photo',
        prompt: 'Professional product photo of [product] on [surface] with [lighting], studio lighting, high resolution, commercial photography',
        example: 'Professional product photo of a coffee mug on a wooden table with morning sunlight, studio lighting, high resolution, commercial photography'
      },
      {
        name: 'E-commerce Product Shot',
        prompt: 'Clean product photography of [product] on white background, centered, professional lighting, high detail, e-commerce ready',
        example: 'Clean product photography of a smartwatch on white background, centered, professional lighting, high detail, e-commerce ready'
      },
      {
        name: 'Lifestyle Product Photo',
        prompt: 'Lifestyle product photo of [product] in [setting], natural lighting, authentic, lifestyle photography',
        example: 'Lifestyle product photo of a backpack in mountain setting, natural lighting, authentic, lifestyle photography'
      }
    ]
  },
  {
    category: 'Social Media Graphics',
    templates: [
      {
        name: 'Instagram Post',
        prompt: 'Vibrant social media graphic for [topic], modern design, eye-catching colors, Instagram style, 1080x1080',
        example: 'Vibrant social media graphic for fitness motivation, modern design, eye-catching colors, Instagram style, 1080x1080'
      },
      {
        name: 'Story Background',
        prompt: 'Minimalist background for [theme], soft colors, Instagram story format, 1080x1920, clean aesthetic',
        example: 'Minimalist background for wellness content, soft colors, Instagram story format, 1080x1920, clean aesthetic'
      },
      {
        name: 'LinkedIn Post',
        prompt: 'Professional business graphic for [topic], corporate style, clean design, LinkedIn post format',
        example: 'Professional business graphic for team collaboration, corporate style, clean design, LinkedIn post format'
      }
    ]
  },
  {
    category: 'Illustrations',
    templates: [
      {
        name: 'Minimalist Line Art',
        prompt: 'Minimalist line art illustration of [subject], clean lines, simple design, monochrome',
        example: 'Minimalist line art illustration of a mountain landscape, clean lines, simple design, monochrome'
      },
      {
        name: 'Flat Design Icon',
        prompt: 'Flat design icon of [subject], modern style, bold colors, simple shapes, vector style',
        example: 'Flat design icon of a smartphone, modern style, bold colors, simple shapes, vector style'
      },
      {
        name: 'Watercolor Illustration',
        prompt: 'Watercolor illustration of [subject], soft colors, artistic style, hand-painted look',
        example: 'Watercolor illustration of a flower bouquet, soft colors, artistic style, hand-painted look'
      }
    ]
  },
  {
    category: 'Backgrounds',
    templates: [
      {
        name: 'Gradient Background',
        prompt: 'Smooth gradient background, [color1] to [color2], modern, clean, abstract',
        example: 'Smooth gradient background, blue to purple, modern, clean, abstract'
      },
      {
        name: 'Texture Background',
        prompt: 'Textured background with [texture], subtle pattern, neutral colors, professional',
        example: 'Textured background with paper texture, subtle pattern, neutral colors, professional'
      },
      {
        name: 'Geometric Background',
        prompt: 'Geometric pattern background, [shapes], modern design, [colors], abstract',
        example: 'Geometric pattern background, triangles, modern design, blue and white, abstract'
      }
    ]
  },
  {
    category: 'Characters',
    templates: [
      {
        name: 'Business Person',
        prompt: 'Professional business person, [description], corporate attire, confident pose, professional photography',
        example: 'Professional business person, young woman, corporate attire, confident pose, professional photography'
      },
      {
        name: 'Casual Portrait',
        prompt: 'Casual portrait of [description], natural lighting, authentic expression, lifestyle photography',
        example: 'Casual portrait of a young man, natural lighting, authentic expression, lifestyle photography'
      },
      {
        name: 'Diverse Team',
        prompt: 'Diverse team of professionals, [setting], collaborative atmosphere, modern office, professional photography',
        example: 'Diverse team of professionals, meeting room, collaborative atmosphere, modern office, professional photography'
      }
    ]
  }
]

async function seedPromptTemplates() {
  console.log('🌱 Seeding prompt templates...')

  // This would be used to populate a prompt templates table if we create one
  // For now, we'll store these in the system config
  await prisma.systemConfig.create({
    data: {
      key: 'prompt_templates',
      value: PROMPT_TEMPLATES,
      category: 'features',
      description: 'Curated prompt templates for AI generation',
      isPublic: true,
    }
  })

  console.log('✅ Prompt templates seeded')
}

export { PROMPT_TEMPLATES, seedPromptTemplates }
