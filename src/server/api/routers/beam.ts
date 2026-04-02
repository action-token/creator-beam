import { BeamType, StyleCategory } from "@prisma/client"
import { z } from "zod"
import { beamXDRForAsset } from "~/lib/stellar/beam"
import { SignUser } from "~/lib/stellar/utils"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc"
import crypto from "crypto"
import { generateImage } from "~/pages/api/generate-image"

export const beamRouter = createTRPCRouter({
  createBeamXDR: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        signWith: SignUser,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("Creating Beam XDR for amount:", input.amount)
      const userId = ctx.session.user.id
      return beamXDRForAsset({
        userId,
        signWith: input.signWith,
        amount: Number(input.amount),
      })
    }),

  create: protectedProcedure
    .input(
      z.object({
        type: z.nativeEnum(BeamType),
        senderName: z.string().min(1),
        recipientName: z.string().min(1),
        message: z.string().optional(),
        contentUrl: z.string().optional(),
        styleCategory: z.nativeEnum(StyleCategory).optional(),
        style: z.string().optional(),
        customPrompt: z.string().optional(),
        overlayText: z.string().optional(),
        arEnabled: z.boolean().default(false),
        isPublic: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.beam.create({
        data: {
          ...input,
          userId: ctx.session.user.id
        },
      })
    }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const beam = await ctx.db.beam.findUnique({
      where: { id: input.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!beam) {
      throw new Error("Beam not found")
    }



    return beam
  }),

  getMyBeams: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.beam.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        reactions: true,
        comments: true,
      },
      orderBy: { createdAt: "desc" },
    })
  }),
  togglePublic: protectedProcedure
    .input(z.object({ id: z.string(), isPublic: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const beam = await ctx.db.beam.findUnique({
        where: { id: input.id },
      })

      if (!beam || beam.userId !== ctx.session.user.id) {
        throw new Error("Unauthorized")
      }

      return ctx.db.beam.update({
        where: { id: input.id },
        data: { isPublic: !input.isPublic },
      })
    }),
  getPublicBeams: publicProcedure
    .input(
      z.object({
        type: z.nativeEnum(BeamType).optional(),
        styleCategory: z.nativeEnum(StyleCategory).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.beam.findMany({
        where: {
          isPublic: true,
          ...(input.type && { type: input.type }),
          ...(input.styleCategory && { styleCategory: input.styleCategory }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          reactions: true,
          comments: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  addReaction: protectedProcedure
    .input(
      z.object({
        beamId: z.string(),
        emoji: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.beamReaction.upsert({
        where: {
          beamId_userId: {
            beamId: input.beamId,
            userId: ctx.session.user.id,
          },
        },
        update: {
          emoji: input.emoji,
        },
        create: {
          beamId: input.beamId,
          userId: ctx.session.user.id,
          emoji: input.emoji,
        },
      })
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        beamId: z.string(),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.beamComment.create({
        data: {
          beamId: input.beamId,
          userId: ctx.session.user.id,
          content: input.content,
        },
      })
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const beam = await ctx.db.beam.findUnique({
      where: { id: input.id },
    })

    if (!beam || beam.userId !== ctx.session.user.id) {
      throw new Error("Unauthorized")
    }

    return ctx.db.beam.delete({
      where: { id: input.id },
    })
  }),
  recentBeams: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.beam.findMany({
      where: {
        isPublic: true,
        type: {
          in: [
            BeamType.AI,
            BeamType.POSTCARD,
            BeamType.VIDEO
          ]
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        reactions: true,
        comments: true,
        _count: {
          select: {
            reactions: true,
            comments: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })
  }),

  createShareToken: protectedProcedure
    .input(z.object({ beamId: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const beam = await ctx.db.beam.findUnique({
        where: { id: input.beamId },
      })
      if (!beam || beam.userId !== ctx.session.user.id) {
        throw new Error("Unauthorized")
      }

      // Generate a secure random token
      const token = crypto.randomBytes(32).toString("hex")

      return ctx.db.beamShareToken.create({
        data: {
          token,
          beamId: input.beamId,
        },
      })
    }),

  getBeamWithToken: publicProcedure
    .input(z.object({ id: z.string(), token: z.string().nullable() }))
    .query(async ({ ctx, input }) => {
      let canAccess = false


      const beam = await ctx.db.beam.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },

        },
      })
      if (!beam) {
        return { beam: null, error: "Beam not found" }
      }
      // creator of the beam can always access
      if (beam.userId === ctx.session?.user.id) {
        canAccess = true
      }

      if (!canAccess && input.token) {
        // validate the token using db
        const shareToken = await ctx.db.beamShareToken.findUnique({
          where: { token: input.token },
        })
        if (shareToken) {
          canAccess = true
        }
      }
      if (!canAccess) {
        return { beam: null, error: "Unauthorized" }
      }
      // Increment view count
      await ctx.db.beam.update({
        where: { id: input.id },
        data: { viewCount: { increment: 1 } },
      })


      return { beam, error: null }
    }),

  sendBeamEmail: protectedProcedure
    .input(z.object({ beamId: z.string(), recipientEmail: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const beam = await ctx.db.beam.findUnique({
        where: { id: input.beamId },
      })
      if (!beam) {
        throw new Error("Beam not found.")
      }
      if (beam.userId !== ctx.session.user.id) {
        throw new Error("You are not authorized to send this beam.")
      }

      const token = crypto.randomBytes(32).toString("hex")
      await ctx.db.beamShareToken.create({
        data: {
          token,
          beamId: input.beamId,
        },
      })
      const beamUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/beam/${beam.id}?token=${token}`

      // Send email logic (using a hypothetical sendEmail function)

      // Send email via SendGrid
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: input.recipientEmail }],
              subject: `${beam.senderName || "Someone"} sent you a BEAM! 🎁`,
            },
          ],
          from: {
            email: "beam@beam-us.com",
            name: "BEAM",
          },
          content: [
            {
              type: "text/html",
              value: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>You received a BEAM!</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center" style="padding: 40px 0;">
                        <table role="presentation" style="width: 600px; max-width: 100%; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
                          <!-- Header -->
                          <tr>
                            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
                                ✨ You've Received a BEAM! ✨
                              </h1>
                            </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                            <td style="padding: 40px;">
                              <p style="margin: 0 0 20px; font-size: 18px; color: #333; line-height: 1.6;">
                                Hi ${beam.recipientName || "there"}! 👋
                              </p>
                              
                              <p style="margin: 0 0 20px; font-size: 16px; color: #555; line-height: 1.6;">
                                <strong>${beam.senderName || "Someone special"}</strong> has created a personalized message just for you!
                              </p>
                              
                              <p style="margin: 0 0 30px; font-size: 16px; color: #555; line-height: 1.6;">
                                Click the button below to view your BEAM and experience the magic. ✨
                              </p>
                              
                              <!-- CTA Button -->
                              <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50px; text-align: center;">
                                    <a href="${beamUrl}" style="display: inline-block; padding: 16px 48px; color: white; text-decoration: none; font-size: 18px; font-weight: bold;">
                                      View Your BEAM 🎁
                                    </a>
                                  </td>
                                </tr>
                              </table>
                              
                              <p style="margin: 30px 0 0; font-size: 14px; color: #888; line-height: 1.6; text-align: center;">
                                This link is private and only works for you. It will expire in 30 days.
                              </p>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                                Sent with ❤️ from <strong>BEAM</strong>
                              </p>
                              <p style="margin: 0; font-size: 12px; color: #999;">
                                Create and share your own personalized messages at <a href="https://beam-us.com" style="color: #667eea; text-decoration: none;">beam-us.com</a>
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
              </html>
            `,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] SendGrid error:", errorText)
        return { success: false, error: "Failed to send email" }
      }
      return { success: true }
    }),

  gererateAIResponse: protectedProcedure
    .input(z.object({ prompt: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Call AI service to generate response
      const res = await generateImage(input.prompt)
      return res
    }),

})