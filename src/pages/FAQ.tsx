import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Everything you need to know about ExpertGate
          </p>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How does ExpertGate work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                ExpertGate connects researchers with verified experts. Researchers can browse expert profiles, 
                filter by field and availability, and submit interview requests. Experts can accept, decline, 
                or refer researchers to colleagues. Once accepted, both parties can chat and schedule the interview.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What does the $1.50 platform fee cover?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                The $1.50 fee is a small commission that helps us maintain the platform, verify expert credentials, 
                provide customer support, and ensure a high-quality experience for both researchers and experts. 
                This applies only to academic/research interviews.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How are experts verified?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                All experts must provide proof of their academic credentials, professional affiliations, and 
                expertise. We verify their institutional email addresses, review their publications or professional 
                work, and conduct background checks to ensure they are legitimate experts in their fields.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What are interview limits?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Interview limits protect experts from being overwhelmed with requests. Each expert sets their own 
                monthly limit (e.g., 5 interviews per month). Once they reach their limit, they can choose to 
                increase it, take a break, or refer researchers to colleagues. This ensures quality interactions 
                and prevents expert burnout.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Can interviews be conducted online or offline?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Both options are supported. Researchers can specify their preference when submitting a request, 
                and experts can indicate their availability for either format. Most interviews happen via video call, 
                but in-person meetings can be arranged when both parties agree.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How does the rating system work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                After each completed interview, both the researcher and expert can rate each other. Researchers 
                are rated on professionalism and preparation, while experts are rated on knowledge and helpfulness. 
                Only users who complete interviews can leave ratings, ensuring authentic feedback.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What if an expert declines my request?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                If an expert declines, they may provide a reason or refer you to a colleague who might be a better 
                fit. You can then search for other experts or accept the referral. Your $1.50 fee is only charged 
                when an interview is confirmed, not when a request is submitted.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-8" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How do I become an expert on ExpertGate?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Sign up as an expert, complete your profile with your credentials and expertise areas, and submit 
                verification documents. Our team will review your application within 3-5 business days. Once approved, 
                you can start receiving interview requests from researchers.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-9" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Is ExpertGate only for academic research?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                While we focus primarily on academic and professional research, journalists, documentary makers, 
                and other professional researchers are also welcome. The $1.50 fee applies to academic/research 
                interviews. Commercial or media inquiries may have different pricing arrangements.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-10" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What is your ethics policy?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We maintain strict ethical standards including: transparent pricing, protection against interview 
                fatigue through limits, mandatory verification of all experts, clear consent from both parties, 
                respect for intellectual property, and adherence to research ethics guidelines. We prohibit 
                plagiarism, misrepresentation, and any form of academic misconduct.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FAQ;
