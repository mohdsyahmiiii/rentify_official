"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { malaysianStates, getCitiesByState, searchCities } from "@/lib/data/malaysia-cities"

interface LocationSelectorProps {
  value?: string
  onChange: (location: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export function LocationSelector({
  value = "",
  onChange,
  placeholder = "Select location...",
  className = "",
  required = false,
}: LocationSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedState, setSelectedState] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Parse existing value
  useEffect(() => {
    if (value) {
      const parts = value.split(", ")
      if (parts.length === 2) {
        setSelectedCity(parts[0])
        setSelectedState(parts[1])
      }
    }
  }, [value])

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName)
    setSelectedCity("")
    onChange("")
  }

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName)
    const fullLocation = `${cityName}, ${selectedState}`
    onChange(fullLocation)
  }

  const handleSearchSelect = (location: { city: string; state: string; fullLocation: string }) => {
    setSelectedState(location.state)
    setSelectedCity(location.city)
    onChange(location.fullLocation)
    setOpen(false)
    setSearchQuery("")
  }

  const filteredLocations = searchQuery ? searchCities(searchQuery) : []

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <Label className="text-black font-medium">Location {required && "*"}</Label>

        {/* Search/Quick Select */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between border-gray-300 hover:border-black"
            >
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                {value || placeholder}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search cities..." value={searchQuery} onValueChange={setSearchQuery} />
              <CommandList>
                <CommandEmpty>No cities found.</CommandEmpty>
                <CommandGroup>
                  {filteredLocations.slice(0, 10).map((location) => (
                    <CommandItem
                      key={location.fullLocation}
                      value={location.fullLocation}
                      onSelect={() => handleSearchSelect(location)}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", value === location.fullLocation ? "opacity-100" : "opacity-0")}
                      />
                      <div>
                        <div className="font-medium">{location.city}</div>
                        <div className="text-sm text-gray-500">{location.state}</div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* State and City Selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">State</Label>
          <Select value={selectedState} onValueChange={handleStateChange}>
            <SelectTrigger className="border-gray-300 focus:border-black">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {malaysianStates.map((state) => (
                <SelectItem key={state.name} value={state.name}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-gray-600">City</Label>
          <Select value={selectedCity} onValueChange={handleCityChange} disabled={!selectedState}>
            <SelectTrigger className="border-gray-300 focus:border-black">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {selectedState &&
                getCitiesByState(selectedState).map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
