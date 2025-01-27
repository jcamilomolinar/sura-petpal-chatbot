const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')

// Flujo de agendar cita

const flowAgendar = addKeyword(['agendar']).addAnswer(
        'Aqui podras agendar una cita para tu mascota'
)

// Flujo para emergencias

const FlowEmergencia = addKeyword(['emergencia']).addAnswer(
    [
        'Entiendo, una situación de emergencia puede ser muy angustiante. 😟 ¿Tu mascota necesita un traslado inmediato 🚗 a la clínica veterinaria 🏥 o prefieres que un profesional acuda a tu domicilio 🏠 para atenderla?',
        '',
        'Ingresa *traslado* o *domicilio* segun sea el tipo de atención que requieres'
    ],
    { capture: true },
    async (ctx, { state, fallBack }) => {
        if (!ctx.body.includes('traslado') && !ctx.body.includes('domicilio')) {
            return fallBack(`❌ Ingresa una opción válida! ❌`);
          } else {
            await state.update({ option: ctx.body })
        } 
    }
)
.addAction(async (ctx, { state, flowDynamic }) => {
    const option = state.get('option')
    await flowDynamic(`Has elegido la opción de *${option}*, un asesor se comunicará contigo lo más pronto posible. 📞`)
})

// Flujo de preguntas frecuentes

function getFaqAnswer(questionNumber) {
    const faqAnswers = {
        1: "SURA ofrece servicios de atención veterinaria, agendamiento de citas, recomendaciones personalizadas de cuidado y asistencia en emergencias, como traslados a clínicas veterinarias o visitas a domicilio.",
        2: "Puedes agendar una cita fácilmente a través de este chatbot. Solo necesitarás indicar el tipo de consulta, la especie de tu mascota y la fecha y hora que prefieras.",
        3: "¡Sí! Si tu mascota necesita atención médica en casa, puedes solicitar una consulta veterinaria a domicilio directamente con nuestro chatbot.",
        4: "Nuestro chatbot puede ofrecerte recomendaciones generales según la edad, especie y estado de salud de tu mascota. Sin embargo, para un diagnóstico preciso, te recomendamos agendar una cita con uno de nuestros veterinarios.",
        5: "Si tu mascota enfrenta una emergencia, nuestro chatbot puede coordinar un traslado inmediato a una clínica veterinaria o enviar un profesional a domicilio para asistencia urgente.",
        6: "¡Por supuesto! Basándonos en la especie, edad, y condición de tu mascota, te ofrecemos recomendaciones personalizadas sobre alimentación, ejercicio y cuidados generales.",
        7: "Si no estás seguro de qué tipo de atención necesita tu mascota, nuestro chatbot puede hacerte algunas preguntas sobre su comportamiento y síntomas para sugerir el mejor plan de acción.",
        8: "Sí, dependiendo de las necesidades de tu mascota, nuestro chatbot puede recomendar productos relacionados con la salud, nutrición o el cuidado de tu mascota.",
        9: "Sí, SURA tiene profesionales capacitados para atender a una amplia variedad de mascotas, incluyendo animales exóticos. Solo necesitas especificar el tipo de mascota al hacer tu consulta.",
        10: "Nuestro chatbot te permitirá realizar un seguimiento de la salud de tu mascota. Podemos recordarte las próximas citas o proporcionarte información adicional según el tratamiento que haya recibido."
    };

    return faqAnswers[questionNumber] || "Lo siento, no tengo una respuesta para esa pregunta.";
}

const flowFAQAux = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            "Ingresa el numero de la pregunta que deseas saber o *volver* para regresar al menu principal!"
        ],
        { capture: true }, 
        async (ctx, {flowDynamic, gotoFlow})=> {
            if (ctx.body.includes("volver")){
                return gotoFlow(flowPrincipal);
            } else {
                await flowDynamic(getFaqAnswer(parseInt(ctx.body)));
                return gotoFlow(flowFAQAux);
            }
        }
    );

const flowFAQ = addKeyword(['faq'])
    .addAnswer(
        [
            "1. ¿Qué servicios ofrece SURA para el cuidado de mi mascota?",
            "2. ¿Cómo puedo agendar una cita para mi mascota?",
            "3. ¿SURA ofrece consultas veterinarias a domicilio?",
            "4. ¿Cómo puedo saber si mi mascota está saludable?",
            "5. ¿Qué debo hacer si mi mascota tiene una emergencia?",
            "6. ¿Puedo recibir recomendaciones personalizadas para el cuidado de mi mascota?",
            "7. ¿Qué hago si no sé qué tipo de atención necesita mi mascota?",
            "8. ¿Puedo obtener información sobre productos para mi mascota a través de SURA?",
            "9. ¿SURA ofrece servicios para mascotas exóticas?",
            "10. ¿Cómo puedo realizar un seguimiento después de una consulta o tratamiento?"
        ],
        null,
        async (_, { gotoFlow })=> {
            return gotoFlow(flowFAQAux)
        },
        [flowFAQAux]
    )

// Flow principal

const flowPrincipal = addKeyword(['patata', 'inicio'])
    .addAnswer('⚕️ ¡Hola! Soy el asistente virtual de SURA PetPal! ¿En qué puedo ayudarte hoy?')
    .addAnswer(
        [
            'Te comparto las opciones que tenemos disponibles para tí',
            '',
            '> 🐶 *Agendar* para agendar una cita para tu mascota',
            '',
            '> 🐱 *Emergencia* para informar una emergencia con un asesor',
            '',
            '> 🐰 *FAQ* para consultar nuestra sección de preguntas frecuentes',
            '',
            'Para volver a este menú desde cualquier opción escribe *Inicio*',
        ]
    ).addAnswer(
        [
            'Si te interesa adquirir el plan complementario para tu mascota ingresa al sitio web de SURA',
            '```https://www.epssura.com/```'
        ],
        null,
        null,
        [flowAgendar, flowFAQ, FlowEmergencia]
    )

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
